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

import com.google.common.base.Joiner;

import au.com.bytecode.opencsv.CSVReader;
import au.com.bytecode.opencsv.CSVWriter;

public class JavaScriptTestingParallelWorkStealingTime {
	List<String[]> rows;
	TaskQueue queue;
	String javaScriptFunction;
	PrintWriter writer;
	
	JavaScriptTestingParallelWorkStealingTime(String inputFile, String javaScriptFile, String outputFile){
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
		PrintWriter writer;
		try{
			writer = new PrintWriter(outputFile);
		}
		catch(Exception e){
			System.out.println("Failed to open output file.");
			return;
		}
		this.writer = writer;
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
		PrintWriter writer;
		
		RunTests(TaskQueue queue, String javaScriptFunction, PrintWriter writer){
			this.queue = queue;
			this.javaScriptFunction = javaScriptFunction;
			this.writer = writer;
		}
		
	    public void run() {
			long t0 = System.currentTimeMillis();
			WebDriver driver = new FirefoxDriver();
			long t1 = System.currentTimeMillis();

			String header = "LOAD;" + String.valueOf(t1 - t0);
			writer.println(header);
			
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
					long t3 = System.currentTimeMillis();
					
			        for(int j = 1; j < row.length; j++){
			            row[j] = "'"+row[j]+"'";
			        }
					String argString = Joiner.on(",").join(Arrays.copyOfRange(row, 1, row.length));
					long t4 = System.currentTimeMillis();
					Object ans = ((JavascriptExecutor) driver).executeScript(this.javaScriptFunction+" return func2("+argString+");");
					long t5 = System.currentTimeMillis();
					
					String ansStr = ans.toString() + ";0;" + 
							String.valueOf(t3 - t2) + ";" + 
							String.valueOf(t4 - t3) + ";" + 
							String.valueOf(t5 - t4) + ";";
					
					writer.println(ansStr);
				}
			}
			
	        //Close the browser
	        driver.quit();
	    }
	}
	
	public static void main(String[] args) {
		String inputFile = "resources/input2.csv";
		String javaScriptFile = "resources/titleExtractor.js";
		String outputFile = "resources/output-parlb.csv";
		
		JavaScriptTestingParallelWorkStealingTime runner = new JavaScriptTestingParallelWorkStealingTime(inputFile,javaScriptFile,outputFile);

		long t0 = System.currentTimeMillis();
		runner.execute(8);
		long t1 = System.currentTimeMillis();
		System.out.println(t1 - t0);
		System.out.println("milliseconds");
	}

}
