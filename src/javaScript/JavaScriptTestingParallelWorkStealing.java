package javaScript;

import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Scanner;
import java.util.concurrent.TimeUnit;

import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebDriverException;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.remote.CapabilityType;
import org.openqa.selenium.remote.DesiredCapabilities;
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
	int algorithms;
	List<Integer> subalgorithms;
	CSVWriter writer;
	Boolean jquery;
	Process proxyserver;
	String cachedir;
	
	JavaScriptTestingParallelWorkStealing(){
	}
	
	public void stage(String inputFile, String javaScriptFile, String outputFile, Boolean jquery, int threads){
		this.algorithms = 0;
		this.subalgorithms = new ArrayList<Integer>();
		
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
		this.algorithms = 0;
		//while loop for number of algorithms
		while(true){
			char letter = ((char) ((int) 'a' + this.algorithms));
			if(this.javaScriptFunctions.contains("func_"+letter)){
				this.algorithms++;
				this.subalgorithms.add(0);
				//while loop for number of subalgorithms for each algorithm
				while(true){
					int count = this.subalgorithms.get(this.algorithms-1);
					//System.out.println("func_"+letter+(count+1));
					//System.out.println(this.subalgorithms);
					if(this.javaScriptFunctions.contains("func_"+letter+(count+1))){
						//System.out.println("present");
						//System.out.println(this.subalgorithms);
						this.subalgorithms.set(this.algorithms-1, count+1);
					}
					else{
						//System.out.println("not present");
						//System.out.println(this.subalgorithms);
						break;
					}
				}
			}
			else{
				break;
			}
		}
		System.out.println("algorithms: "+this.algorithms);
		System.out.println("subalgorithms: "+Arrays.toString(this.subalgorithms.toArray()));
		
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
			RunTests r = new RunTests(this.queue,this.javaScriptFunctions, this.algorithms, this.subalgorithms, this.writer, this.jquery);
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
		Date date = new Date();
		String path_to_proxy_server = "/home/mangpo/work/262a/httpmessage/cache/proxyserv.py";
		cachedir = "cache_" + date.toString().replace(" ", "_");
		try {
			proxyserver = Runtime.getRuntime().exec("python " + path_to_proxy_server + " " + cachedir);
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
	public void endSession(){
		proxyserver.destroy();
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
		int algorithms;
		List<Integer> subalgorithms;
		CSVWriter writer;
		Boolean jquery;
		Boolean verbose = true;
		
		RunTests(TaskQueue queue, String javaScriptFunction, int algorithms, List<Integer> subalgorithms, CSVWriter writer, Boolean jquery){
			this.queue = queue;
			this.javaScriptFunction = javaScriptFunction;
			this.writer = writer;
			this.algorithms = algorithms;
			this.subalgorithms = subalgorithms;
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
			String PROXY = "localhost:1234";
			org.openqa.selenium.Proxy proxy = new org.openqa.selenium.Proxy();
			proxy.setHttpProxy(PROXY).setNoProxy("https:*");
			DesiredCapabilities cap = new DesiredCapabilities();
			cap.setCapability(CapabilityType.PROXY, proxy);
			
			WebDriver driver = new FirefoxDriver(cap);
			driver.manage().timeouts().implicitlyWait(30, TimeUnit.SECONDS);
			driver.manage().timeouts().pageLoadTimeout(30, TimeUnit.SECONDS);
			driver.manage().timeouts().setScriptTimeout(30, TimeUnit.SECONDS);

			if (driver instanceof JavascriptExecutor) {
				while (true) {
					String[] row = this.queue.pop();
					//System.out.println(Arrays.toString(row));
					if (row == null){
						break; //the queue is empty
					}
					String url = row[0];
					if (!url.startsWith("http")){url = "http://"+url;}

			        //make the argString, since that will be the same across algorithms and subalgorithms
			        for(int j = 0; j < row.length; j++){
			            row[j] = "'"+row[j]+"'";
			        }
					String argString = Joiner.on(",").join(Arrays.copyOfRange(row, 0, row.length));

			        List<String> ansList = new ArrayList<String>();
			        
			        try{
				        for (int j = 0; j<this.algorithms; j++){
					        //reload for each algorithm
				        	driver.get(url);
	
							char letter = ((char) ((int) 'a' + j));
					        int algorithmSubalgorithms = this.subalgorithms.get(j);
					        for(int i = 0; i<algorithmSubalgorithms; i++){
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
						        Object ans = ((JavascriptExecutor) driver).executeScript(this.javaScriptFunction+" return func_"+letter+(i+1)+"("+argString+");");
								
								
								if(i == (algorithmSubalgorithms-1)){
									if (ans != null){
										ArrayList<String> ansRows = new ArrayList<String>(Arrays.asList(ans.toString().split("@#@")));
										for(int k = 0; k<ansRows.size(); k++){
											String ansRow = ansRows.get(k);
											if (ansList.size()>k){
												ansList.set(k, ansList.get(k)+"<,>"+ansRow);
											}
											else{
												ansList.add(ansRow);
											}
											//if(this.verbose){System.out.println(ansRow);}
										}
									}
								}
					        }
				        }
				        //put anslist in the writer
				        for(int i = 0; i<ansList.size(); i++){
				        	this.writer.writeNext(ansList.get(i).split("<,>"));
				        }
			        }
					catch(WebDriverException e){
						System.out.println(url + ": " + e.toString());
						this.writer.writeNext((url+"<,>"+e.toString().split("\n")[0]).split("<,>"));
						driver.quit();
						driver = new FirefoxDriver(cap);
						driver.manage().timeouts().implicitlyWait(30, TimeUnit.SECONDS);
						driver.manage().timeouts().pageLoadTimeout(30, TimeUnit.SECONDS);
						driver.manage().timeouts().setScriptTimeout(30, TimeUnit.SECONDS);
					}
				}
			}
			
	        //Close the browser
	        driver.quit();
	    }
	}
	
	public static void main(String[] args) {
		String input1 = "resources/input2.csv";
		String javaScript1 = "resources/getXpaths.js";
		String output1 = "resources/xpaths.csv";

		String input2 = "resources/xpaths.csv";
		String javaScript2 = "resources/filter.js";
		String output2 = "resources/fiteredXpaths.csv";

		String input3 = "resources/filteredXpaths.csv";
		String javaScript3 = "resources/nodeSaving.js";
		String output3 = "resources/savedNodes.csv";
		
		String input4 = "resources/savedNodes.csv";
		String javaScript4 = "resources/nodeRetrieving.js";
		String output4 = "resources/nodeRetrieval1-SameSession.csv";

		String output5 = "resources/nodeRetrieval2-DiffSessionButTemporallyClose.csv";
		
		String output6 = "resources/nodeRetrieval3-DiffSessionAndTemporallyFar.csv";
		
		
		Boolean jquery = false;
		int threads = 8;
		
		JavaScriptTestingParallelWorkStealing system = new JavaScriptTestingParallelWorkStealing();
		system.startSession();
		system.stage(input1,javaScript1,output1,jquery,threads);
		system.stage(input2,javaScript2,output2,jquery,threads);
		system.stage(input3,javaScript3,output3,jquery,threads);
		system.stage(input4,javaScript4,output4,jquery,threads);
		system.endSession();
        
		system.startSession();
		system.stage(input4,javaScript4,output5,jquery,threads);
		system.endSession();
	}

}
