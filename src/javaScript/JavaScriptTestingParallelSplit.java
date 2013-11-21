package javaScript;

import java.io.FileReader;
import java.io.FileWriter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.firefox.FirefoxDriver;

import com.google.common.base.Joiner;

import au.com.bytecode.opencsv.CSVReader;
import au.com.bytecode.opencsv.CSVWriter;

public class JavaScriptTestingParallelSplit {
	List<String[]> rows;
	String javaScriptFunction;
	CSVWriter writer;
	
	JavaScriptTestingParallelSplit(String inputFile, String javaScriptFunction, String outputFile){
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
		this.javaScriptFunction = javaScriptFunction;
		
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
		CSVWriter writer;
		
		RunTests(List<String[]> rows, String javaScriptFunction, CSVWriter writer){
			this.rows = rows;
			this.javaScriptFunction = javaScriptFunction;
			this.writer = writer;
		}
		
	    public void run() {
			WebDriver driver = new FirefoxDriver();

			if (driver instanceof JavascriptExecutor) {
				for (int i = 0; i<this.rows.size(); i++){
					String[] row = this.rows.get(i);
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
		String javaScriptFunction = "var func = function(a,b){return document.title+' - '+a+' - '+b;};";
		String outputFile = "resources/output.csv";
		
		JavaScriptTestingParallelSplit runner = new JavaScriptTestingParallelSplit(inputFile,javaScriptFunction,outputFile);
		runner.execute(8);
	}

}
