package javaScript;

import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Scanner;

import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.firefox.FirefoxDriver;

import com.google.common.base.Joiner;

import au.com.bytecode.opencsv.CSVReader;
import au.com.bytecode.opencsv.CSVWriter;

public class JavaScriptTestingParallelWorkStealing {
	List<String[]> rows;
	TaskQueue queue;
	String javaScriptFunction;
	CSVWriter writer;
	
	JavaScriptTestingParallelWorkStealing(String inputFile, String javaScriptFile, String outputFile){
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
			this.javaScriptFunction = new Scanner(new File(javaScriptFile)).useDelimiter("\\Z").next();
		}
		catch(Exception e){System.out.println("Failed to open JavaScript input file."); return;}
		
		//Output
		CSVWriter writer;
		try{
			String csv = "resources/output.csv";
			writer = new CSVWriter(new FileWriter(csv));
		}
		catch(Exception e){
			System.out.println("Failed to open output file.");
			return;
		}
		this.writer = writer;
	}
	
	public void execute(int threads){
		ArrayList<Thread> threadList = new ArrayList<Thread>();
		
		for (int i = 0; i < threads; i++){
			RunTests r = new RunTests(this.queue,this.javaScriptFunction, this.writer);
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
		CSVWriter writer;
		
		RunTests(TaskQueue queue, String javaScriptFunction, CSVWriter writer){
			this.queue = queue;
			this.javaScriptFunction = javaScriptFunction;
			this.writer = writer;
		}
		
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
			        for(int j = 1; j < row.length; j++){
			            row[j] = "'"+row[j]+"'";
			        }
					String argString = Joiner.on(",").join(Arrays.copyOfRange(row, 1, row.length));
					Object ans = ((JavascriptExecutor) driver).executeScript(this.javaScriptFunction+" return func("+argString+");");
					
					String [] ansArray = ans.toString().split("#"); 
					this.writer.writeNext(ansArray);
				}
			}
			
	        //Close the browser
	        driver.quit();
	    }
	}
	
	public static void main(String[] args) {
		String inputFile = "resources/input2.csv";
		String javaScriptFile = "resources/titleExtractor.js";
		String outputFile = "resources/output.csv";
		
		JavaScriptTestingParallelWorkStealing runner = new JavaScriptTestingParallelWorkStealing(inputFile,javaScriptFile,outputFile);
		runner.execute(8);
	}

}
