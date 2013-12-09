package javaScript;

import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Scanner;
import java.util.concurrent.TimeUnit;

import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebDriverException;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.remote.CapabilityType;
import org.openqa.selenium.remote.DesiredCapabilities;

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
		writer.println("url;title;start-up;load;execute");
		
		long start = System.currentTimeMillis();
			
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

		long stop = System.currentTimeMillis();
		writer.println("TOTAL;" + String.valueOf(stop-start)); 
		
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
			String PROXY = "localhost:8000";
			org.openqa.selenium.Proxy proxy = new org.openqa.selenium.Proxy();
			proxy.setHttpProxy(PROXY).setNoProxy("https:*");
			DesiredCapabilities cap = new DesiredCapabilities();
			cap.setCapability(CapabilityType.PROXY, proxy);
			
			WebDriver driver = new FirefoxDriver();
			driver.manage().timeouts().implicitlyWait(10, TimeUnit.SECONDS);
			driver.manage().timeouts().pageLoadTimeout(10, TimeUnit.SECONDS);
			driver.manage().timeouts().setScriptTimeout(10, TimeUnit.SECONDS);
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
					try {
						long t2 = System.currentTimeMillis();
						driver.get(url);
						long t3 = System.currentTimeMillis();
					
						for(int j = 1; j < row.length; j++){
							row[j] = "'"+row[j]+"'";
						}
						String argString = Joiner.on(",").join(Arrays.copyOfRange(row, 1, row.length));
						Object ans = ((JavascriptExecutor) driver).executeScript(this.javaScriptFunction+" return func2("+argString+");");
						long t4 = System.currentTimeMillis();
						
						String ansStr = url + ";" + ans.toString() + ";0;" + 
								String.valueOf(t3 - t2) + ";" + 
								String.valueOf(t4 - t3) + ";";
						
						writer.println(ansStr);
					}
					catch(WebDriverException e){
						System.out.println(url + ": " + e.toString());
						writer.println(url + ";" + e.toString().split("\n")[0]);
						driver.quit();
						driver = new FirefoxDriver();
						driver.manage().timeouts().implicitlyWait(10, TimeUnit.SECONDS);
						driver.manage().timeouts().pageLoadTimeout(10, TimeUnit.SECONDS);
						driver.manage().timeouts().setScriptTimeout(10, TimeUnit.SECONDS);
					}
				}
			}
			
	        //Close the browser
	        driver.quit();
	    }
	}
	
	public static void main(String[] args) {
		String inputFile = "resources/input.csv";
		String javaScriptFile = "resources/titleExtractor.js";
		String outputFile = "resources/output.csv";
		
		JavaScriptTestingParallelWorkStealingTime runner = new JavaScriptTestingParallelWorkStealingTime(inputFile,javaScriptFile,outputFile);
		runner.execute(8);
	}

}
