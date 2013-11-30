package javaScript;

import java.io.FileReader;
import java.io.FileWriter;
import java.io.File;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Scanner;

import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.firefox.FirefoxDriver;

import au.com.bytecode.opencsv.CSVReader;
import au.com.bytecode.opencsv.CSVWriter;

import com.google.common.base.Joiner;

public class JavaScriptTestingParallelSplit {
	List<String[]> rows;
	String javaScriptFunction;
	PrintWriter writer;
	
	JavaScriptTestingParallelSplit(String inputFile, String javaScriptFile, String outputFile){
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
	
		int jobs = rows.size();
		if (threads > jobs){
			threads = jobs;
		}
		int low = jobs/threads;
		int high = low+1;
		int threshold = jobs%threads;
		int rowCounter = 0;
		ArrayList<Thread> threadList = new ArrayList<Thread>();
		for (int i = 0; i < threads; i++){
			int jump = (i < threshold) ? high : low;
			List<String[]> rowsSlice = this.rows.subList(rowCounter, rowCounter+jump);
			rowCounter += jump;
			RunTests r = new RunTests(rowsSlice,this.javaScriptFunction, this.writer);
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
	
	private static class RunTests implements Runnable {
		List<String[]> rows;
		String javaScriptFunction;
		PrintWriter writer;
		
		RunTests(List<String[]> rows, String javaScriptFunction, PrintWriter writer){
			this.rows = rows;
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
				for (int i = 0; i<this.rows.size(); i++){
					String[] row = this.rows.get(i);
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
					Object ans = ((JavascriptExecutor) driver).executeScript(this.javaScriptFunction+" return func("+argString+");");
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
		String outputFile = "resources/output-parsplit.csv";
		
		JavaScriptTestingParallelSplit runner = new JavaScriptTestingParallelSplit(inputFile,javaScriptFile,outputFile);
		long t0 = System.currentTimeMillis();
		runner.execute(8);
		long t1 = System.currentTimeMillis();
		System.out.println(t1 - t0);
		System.out.println("milliseconds");
	}

}
