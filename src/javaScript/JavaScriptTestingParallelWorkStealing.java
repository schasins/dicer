package javaScript;

import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Scanner;

import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.support.ui.ExpectedCondition;
import org.openqa.selenium.support.ui.Wait;
import org.openqa.selenium.support.ui.WebDriverWait;

import com.google.common.base.Joiner;

import au.com.bytecode.opencsv.CSVReader;
import au.com.bytecode.opencsv.CSVWriter;

public class JavaScriptTestingParallelWorkStealing {
	List<String[]> rows;
	TaskQueue queue;
	String javaScriptFunctions;
	int functions;
	CSVWriter writer;
	Boolean jquery;
	
	JavaScriptTestingParallelWorkStealing(){
	}
	
	public void stage(String inputFile, String javaScriptFile, String outputFile, Boolean jquery, int threads){
		//Input 1
		List<String[]> rows = new ArrayList<String[]>();
		try {
			CSVReader reader = new CSVReader(new FileReader(inputFile));
		    rows = reader.readAll();
		}
		catch(Exception e){
			System.out.println("Failed to open input file.");
			return;
		}
		this.rows = rows;
		this.queue = new TaskQueue(this.rows);

		//Input 2
		try{
			this.javaScriptFunctions = new Scanner(new File(javaScriptFile)).useDelimiter("\\Z").next();
		}
		catch(Exception e){System.out.println("Failed to open JavaScript input file."); return;}
		this.functions = 0;
		while(true){
			if(this.javaScriptFunctions.contains("var func"+(this.functions+1))){
				this.functions++;
			}
			else{
				break;
			}
		}
		System.out.println("functions: "+this.functions);
		
		//Output
		CSVWriter writer;
		try{
			writer = new CSVWriter(new FileWriter(outputFile));
		}
		catch(Exception e){
			System.out.println("Failed to open output file.");
			return;
		}
		this.writer = writer;
		
		this.jquery = jquery;
		
		this.execute(threads);
	}
	
	public void execute(int threads){
		ArrayList<Thread> threadList = new ArrayList<Thread>();
		
		for (int i = 0; i < threads; i++){
			RunTests r = new RunTests(this.queue,this.javaScriptFunctions, this.functions, this.writer, this.jquery);
	        Thread t = new Thread(r);
	        threadList.add(t);
	        t.start();
		}
		
		//barrier
		for (Thread thread : threadList) {
		    try {thread.join();} catch (InterruptedException e) {System.out.println("Could not join thread.");}
		}
		
		//Close output writer
		try{writer.close();}catch(Exception e){System.out.println("Failed to close output file.");}			
	}
	
	public void startSession(){
		
	}
	
	public void endSession(){
		
	}
	
	private class TaskQueue {
		List<String[]> rows;
		
		public TaskQueue(List<String[]> rows){
			this.rows = rows;
		}
		
		public synchronized String[] pop(){
			if (this.rows.size()>0){
				String[] row = this.rows.get(0);
				rows = rows.subList(1, rows.size());
				return row;
			}
			return null;
		}
		
		public boolean empty(){
			return this.rows.size() == 0;
		}
	}
	
	private static class RunTests implements Runnable {
		TaskQueue queue;
		String javaScriptFunction;
		int functions;
		CSVWriter writer;
		Boolean jquery;
		Boolean verbose = true;
		
		RunTests(TaskQueue queue, String javaScriptFunction, int functions, CSVWriter writer, Boolean jquery){
			this.queue = queue;
			this.javaScriptFunction = javaScriptFunction;
			this.writer = writer;
			this.functions = functions;
			this.jquery = jquery;
		}
		
		/*
		 public Boolean waitForPageLoaded(WebDriver driver) {
		     ExpectedCondition<Boolean> expectation = new ExpectedCondition<Boolean>() {
		        public Boolean apply(WebDriver driver) {
		          return ((JavascriptExecutor)driver).executeScript("return document.readyState").equals("complete");
		        }
		      };

		     Wait<WebDriver> wait = new WebDriverWait(driver,30);
		      try {
		              wait.until(expectation);
		      } catch(Throwable error) {
		              System.out.println("Timeout waiting for Page Load Request to complete.");
		              return false;
		      }
		      return true;
		 } 
		 */
		
	    public void run() {
			WebDriver driver = new FirefoxDriver();

			if (driver instanceof JavascriptExecutor) {
				while (true) {
					String[] row = this.queue.pop();
					if (row == null){
						break; //the queue is empty
					}
					String url = row[0];
					if (!url.startsWith("http")){url = "http://"+url;}
			        driver.get(url);
			        
			        //make the argString, since that will be the same across subalgorithms
			        for(int j = 0; j < row.length; j++){
			            row[j] = "'"+row[j]+"'";
			        }
					String argString = Joiner.on(",").join(Arrays.copyOfRange(row, 0, row.length));
					
			        List<List<String>> ansList = new ArrayList<List<String>>();
			        for(int i = 0; i<this.functions; i++){
				        //load jquery if we need it and if we're on a new page
				        if (this.jquery){
					        String jqueryCode;
					        try{
								jqueryCode = new Scanner(new File("resources/jquery-1.10.2.min.js")).useDelimiter("\\Z").next();
							}
							catch(Exception e){System.out.println("Failed to open jquery file."); return;}
					        ((JavascriptExecutor) driver).executeScript(jqueryCode);
				        }
				        
				        //System.out.println(this.javaScriptFunction+" return func"+(i+1)+"("+argString+");");
				        Object ans = ((JavascriptExecutor) driver).executeScript(this.javaScriptFunction+" return func"+(i+1)+"("+argString+");");
						
						
						if(i == (this.functions-1)){
							if (ans != null){
								ArrayList<String> ansRows = new ArrayList<String>(Arrays.asList(ans.toString().split("@#@")));
								for(int j = 0; j<ansRows.size(); j++){
									String ansRow = ansRows.get(j);
									//if(this.verbose){System.out.println(ansRow);}
									this.writer.writeNext(ansRow.split("<,>"));
								}
							}
						}
			        }
				}
			}
			
	        //Close the browser
	        driver.quit();
	        try {
				this.writer.close();
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
	    }
	}
	
	public static void main(String[] args) {
		String input1 = "resources/input1-small.csv";
		String javaScript1 = "resources/getXpaths.js";
		String output1 = "resources/output1.csv";

		String input2 = "resources/output1.csv";
		String javaScript2 = "resources/filter.js";
		String output2 = "resources/output2.csv";

		String input3 = "resources/output2.csv";
		String javaScript3 = "resources/nodeSaving.js";
		String output3 = "resources/output3.csv";
		
		Boolean jquery = false;
		int threads = 8;
		
		JavaScriptTestingParallelWorkStealing system = new JavaScriptTestingParallelWorkStealing();
		system.startSession();
		system.stage(input1,javaScript1,output1,jquery,threads);
		system.stage(input2,javaScript2,output2,jquery,threads);
		system.stage(input3,javaScript3,output3,jquery,threads);
		system.endSession();
	}

}
