package javaScript;

import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.PrintWriter;
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
<<<<<<< HEAD
	String javaScriptFunction;
	PrintWriter writer;
=======
	String javaScriptFunctions;
	int functions;
	CSVWriter writer;
	Boolean jquery;
>>>>>>> c317c4f2e144e4bf7aa0ffdda477126cf6e2f869
	
	JavaScriptTestingParallelWorkStealing(String inputFile, String javaScriptFile, String outputFile, Boolean jquery){
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
		PrintWriter writer;
		try{
			writer = new PrintWriter(outputFile);
		}
		catch(Exception e){
			System.out.println("Failed to open output file.");
			return;
		}
		this.writer = writer;
		
		this.jquery = jquery;
	}
	
	public void execute(int threads){
		String header = "title" + ";" + 
				"start-up" + ";" + 
				"load" + ";" + 
				"read-args" + ";" + 
				"execute" + ";";
			writer.println(header);
			
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
<<<<<<< HEAD
		PrintWriter writer;
		
		RunTests(TaskQueue queue, String javaScriptFunction, PrintWriter writer){
=======
		int functions;
		CSVWriter writer;
		Boolean jquery;
		Boolean verbose = true;
		
		RunTests(TaskQueue queue, String javaScriptFunction, int functions, CSVWriter writer, Boolean jquery){
>>>>>>> c317c4f2e144e4bf7aa0ffdda477126cf6e2f869
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
			long t0 = System.currentTimeMillis();
			WebDriver driver = new FirefoxDriver();
			long t1 = System.currentTimeMillis();

			if (driver instanceof JavascriptExecutor) {
				while (true) {
					String[] row = this.queue.pop();
					if (row == null){
						break; //the queue is empty
					}
					String url = row[0];
					if (!url.startsWith("http")){url = "http://"+url;}
					long t2 = System.currentTimeMillis();
			        driver.get(url);
<<<<<<< HEAD
					long t3 = System.currentTimeMillis();
					
=======
			        
			        //make the argString, since that will be the same across pages
>>>>>>> c317c4f2e144e4bf7aa0ffdda477126cf6e2f869
			        for(int j = 1; j < row.length; j++){
			            row[j] = "'"+row[j]+"'";
			        }
					String argString = Joiner.on(",").join(Arrays.copyOfRange(row, 1, row.length));
<<<<<<< HEAD
					long t4 = System.currentTimeMillis();
					Object ans = ((JavascriptExecutor) driver).executeScript(this.javaScriptFunction+" return func("+argString+");");
					long t5 = System.currentTimeMillis();
					
					String ansStr = ans.toString() + ";0;" + 
							String.valueOf(t3 - t2) + ";" + 
							String.valueOf(t4 - t3) + ";" + 
							String.valueOf(t5 - t4) + ";";
					
					writer.println(ansStr);
=======
			        
			        List<String> ansList = new ArrayList<String>();
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
				        Object ans = ((JavascriptExecutor) driver).executeAsyncScript(this.javaScriptFunction+" return func"+(i+1)+"("+argString+");");
						if(this.verbose){System.out.println(ans);}
						
						ArrayList<String> ansListPortion = new ArrayList<String>(Arrays.asList(ans.toString().split("#")));
						if (ans!=null) {ansList.addAll(ansListPortion);}
			        }
					this.writer.writeNext(ansList.toArray(new String[ansList.size()]));
>>>>>>> c317c4f2e144e4bf7aa0ffdda477126cf6e2f869
				}
			}
			
	        //Close the browser
	        driver.quit();
	    }
	}
	
	public static void main(String[] args) {
		String inputFile = "resources/input2.csv";
		String javaScriptFile = "resources/titleExtractor.js";
<<<<<<< HEAD
		String outputFile = "resources/output-parlb.csv";
		
		JavaScriptTestingParallelWorkStealing runner = new JavaScriptTestingParallelWorkStealing(inputFile,javaScriptFile,outputFile);

		long t0 = System.currentTimeMillis();
=======
		String outputFile = "resources/output.csv";
		Boolean jquery = true;
		
		JavaScriptTestingParallelWorkStealing runner = new JavaScriptTestingParallelWorkStealing(inputFile,javaScriptFile,outputFile,jquery);
>>>>>>> c317c4f2e144e4bf7aa0ffdda477126cf6e2f869
		runner.execute(8);
		long t1 = System.currentTimeMillis();
		System.out.println(t1 - t0);
		System.out.println("milliseconds");
	}

}
