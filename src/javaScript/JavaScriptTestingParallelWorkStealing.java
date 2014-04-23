package javaScript;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Scanner;
import java.util.concurrent.Callable;
import java.util.concurrent.TimeUnit;

import org.apache.commons.exec.CommandLine;
import org.apache.commons.exec.DefaultExecutor;
import org.apache.commons.exec.PumpStreamHandler;
import org.openqa.selenium.Capabilities;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebDriverException;
import org.openqa.selenium.firefox.FirefoxBinary;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxProfile;
import org.openqa.selenium.firefox.internal.ProfilesIni;
import org.openqa.selenium.remote.CapabilityType;
import org.openqa.selenium.remote.DesiredCapabilities;

import com.google.common.base.Joiner;
import com.google.common.util.concurrent.SimpleTimeLimiter;
import com.google.common.util.concurrent.TimeLimiter;

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
	int stages;
	
	String determinizeCode;
	
	// JavaScript for DOM Modification
	static String DOMModifierFunctions;
	static int DOMChange;
	
	//String path_to_proxyserver = "/home/mangpo/work/262a/httpmessage/";
	String path_to_proxyserver = "/home/sarah/Dropbox/Berkeley/research/similarityAlgorithms/cache-proxy-server/";
	// Number of done jobs
	static int finishedJobs;
	
	JavaScriptTestingParallelWorkStealing() {
		stages = 0;
		this.DOMChange = 0;
	}
	
	JavaScriptTestingParallelWorkStealing(int DOMChange) {
		stages = 0;
		this.DOMChange = DOMChange;
		try {
			this.DOMModifierFunctions = new Scanner(new File("src/javaScript/DOMModifier.js")).useDelimiter("\\Z").next();
		} catch (FileNotFoundException e) {
			// TODO Auto-generated catch block
			System.out.println("Failed to open input src/javaScript/DOMModifier.js.");
			System.exit(1);
		}
	}
	
	public void stage(String inputFile, String javaScriptFile, String outputFile, Boolean jquery, int threads){
		this.stages ++;
		System.out.println("STAGE "+this.stages);
		
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
		long start = System.currentTimeMillis();
		ArrayList<Thread> threadList = new ArrayList<Thread>();
		
		for (int i = 0; i < threads; i++){
			RunTests r = new RunTests(this.queue,this.javaScriptFunctions, this.algorithms, this.subalgorithms, this.writer, this.jquery, i, this.determinizeCode);
	        Thread t = new Thread(r);
	        threadList.add(t);
	        t.start();
		}
		
		//barrier
		for (Thread thread : threadList) {
		    try {thread.join();} catch (InterruptedException e) {System.out.println("Could not join thread.");}
		}

		long stop = System.currentTimeMillis();
		String[] times = new String[1];
		times[0] = String.valueOf((stop-start)/1000);
		this.writer.writeNext(times);
		
		//Close output writer
		try{writer.close();}catch(Exception e){System.out.println("Failed to close output file.");}			
	}
	
	public void startSession(){
		System.out.println("Starting session.");
		try {
			System.out.println("mkdir " + path_to_proxyserver + ".cache");
			Process p = Runtime.getRuntime().exec("rm -r " + path_to_proxyserver + ".cache");
			p.waitFor();
			p = Runtime.getRuntime().exec("mkdir " + path_to_proxyserver + ".cache");
			p.waitFor();
		} catch (IOException | InterruptedException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		try{
			this.determinizeCode = new Scanner(new File("resources/determinize.js")).useDelimiter("\\Z").next();
			this.determinizeCode.concat("determinize("+System.currentTimeMillis()+");");
		}
		catch(Exception e){System.out.println("Failed to open determinize input file."); return;}
	}
	
	public void endSession(){
		System.out.println("Ending session.");
		Date date = new Date();
		String cache_dir = "arch_" + date.toString().replace(" ", "_");
		try {
			Process p = Runtime.getRuntime().exec("mv " + path_to_proxyserver + ".cache " + path_to_proxyserver + cache_dir);
			p.waitFor();
			System.out.print("mv " + path_to_proxyserver + ".cache " + path_to_proxyserver + cache_dir);
		} catch (IOException | InterruptedException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
	private class TaskQueue {
		List<String[]> rows;
		int count, timeout;
		long start;
		
		public TaskQueue(List<String[]> rows){
			this.rows = rows;
			// Comment out this line for scailability test
			/*this.count = 0;
			this.timeout = 0;
			start = System.currentTimeMillis();
			try {
				PrintWriter output = new PrintWriter(new FileWriter("time.csv"));
				output.close();
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}*/
		}
		
		public synchronized String[] pop(){
			if (this.rows.size()>0){
				String[] row = this.rows.get(0);
				rows = rows.subList(1, rows.size());
				return row;
			}
			return null;
		}
		
		// Scalability test only
		public synchronized void timeout() {
			timeout++;
		}

		// Scalability test only
		public synchronized void done() {
			count++;
			if(count%100 == 0) {
				try {
					PrintWriter output = new PrintWriter(new FileWriter("time.csv", true));
					output.write(count + "," + (System.currentTimeMillis()-start)/1000);
					output.write("," + timeout + "\n");
					output.close();
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
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
		int index;
		String determinizeCode;
		
		RunTests(TaskQueue queue, String javaScriptFunction, int algorithms, List<Integer> subalgorithms, CSVWriter writer, Boolean jquery, int i, String determinizeCode){
			this.queue = queue;
			this.javaScriptFunction = javaScriptFunction;
			this.writer = writer;
			this.algorithms = algorithms;
			this.subalgorithms = subalgorithms;
			this.jquery = jquery;
			this.index = i;
			this.determinizeCode = determinizeCode;
		}
		
		public void print(String s){
			System.out.println("["+this.index+"]"+s);
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
		
		// does the actual driver creation, calls replaceDriver in case of issues
		public WebDriver newDriver(DesiredCapabilities cap){
			try{
			FirefoxProfile profile = new ProfilesIni().getProfile("default");
	        profile.setPreference("network.cookie.cookieBehavior", 2);
	            
			//WebDriver driver = new FirefoxDriver(cap);
			//WebDriver driver = new FirefoxDriver();
	        WebDriver driver = new FirefoxDriver(new FirefoxBinary(), profile, cap, cap);
			driver.manage().timeouts().implicitlyWait(40, TimeUnit.SECONDS);
			driver.manage().timeouts().pageLoadTimeout(40, TimeUnit.SECONDS);
			driver.manage().timeouts().setScriptTimeout(40, TimeUnit.SECONDS);
			
			return driver;
			}
			catch (WebDriverException exc){
				print("WebDriver excpetion trying to create new driver.");
				print(exc.toString().split("\n")[0]);
				return replaceDriver(null,cap);
			}
			
		}
		

		//quits the original driver, checks for defunct processes, calls newDriver to actually create new driver
		public WebDriver replaceDriver(WebDriver driver, DesiredCapabilities cap){
			if (driver != null) {driver.quit();}
			//in case anything goes wrong, let's check for defunct processes
			try {
				String result = execToString("ps -e");
				
				String[] lines = result.split(System.getProperty("line.separator"));
				String lastFirefox = "";
				for (int i = 0; i<lines.length; i++){
					String l = lines[i];
					if (l.contains("firefox") && l.contains("defunct")){
						print("Killing: "+lastFirefox);
						execToString("kill "+lastFirefox);
					}
					else if (l.contains("firefox")){
						lastFirefox = l.trim().split(" ")[0];
					}
				}
			} catch (Exception e1) {
				print("Weren't able to close defunct processes.");
				e1.printStackTrace();
			}
			return newDriver(cap);
		}
		
		private void loadPage(WebDriver driver, String url) {
			driver.get(url);

			((JavascriptExecutor) driver).executeScript(this.determinizeCode);
			// TODO: modify DOM here.
			Object ans;
			switch(DOMChange) {
			case 1:
				/*System.out.println("MODIFY DOM 1");
				ans = ((JavascriptExecutor) driver).executeScript(DOMModifierFunctions+
						" return getElementByXpath(\"HTML/BODY/DIV[1]/DIV[4]/SPAN[1]/CENTER[1]/DIV[1]/IMG[1]\").tagName;");
				System.out.println(ans.toString());*/
				((JavascriptExecutor) driver).executeScript(DOMModifierFunctions+" return centerFirstLevelDiv();");
				/*ans = ((JavascriptExecutor) driver).executeScript(DOMModifierFunctions+
						" return getElementByXpath(\"HTML/BODY/CENTER[1]/DIV[1]/DIV[4]/SPAN[1]/CENTER[1]/DIV[1]/IMG[1]\").tagName;");
				System.out.println(ans.toString());*/
				break;
			case 2:
				/*System.out.println("MODIFY DOM 2");
				ans = ((JavascriptExecutor) driver).executeScript(DOMModifierFunctions+
						" return getElementByXpath(\"HTML/BODY/DIV[1]/DIV[1]\").id;");
				System.out.println(ans.toString());*/
				((JavascriptExecutor) driver).executeScript(DOMModifierFunctions+" return insertNodes();");
				/*ans = ((JavascriptExecutor) driver).executeScript(DOMModifierFunctions+
						" return getElementByXpath(\"HTML/BODY/DIV[2]/DIV[2]\").id;");
				System.out.println(ans.toString());*/
				break;
			case 3:
				/*System.out.println("MODIFY DOM 3");
				ans = ((JavascriptExecutor) driver).executeScript(
						" return document.body.getElementsByTagName(\"h2\").length;");
				System.out.println(ans.toString());*/
				((JavascriptExecutor) driver).executeScript(DOMModifierFunctions+" return spanToP();");
				/*ans = ((JavascriptExecutor) driver).executeScript(
						" return document.body.getElementsByTagName(\"h2\").length;");
				System.out.println(ans.toString());*/
				break;
			case 4:
				((JavascriptExecutor) driver).executeScript(DOMModifierFunctions+" return moveAround();");
				break;
			case 5:
				/*System.out.println("MODIFY DOM 5");
				ans = ((JavascriptExecutor) driver).executeScript(DOMModifierFunctions+
						" return getElementByXpath(\"HTML/BODY/DIV[1]/DIV[1]/DIV[1]/SPAN[1]/SPAN[1]\").textContent;");
				System.out.println(ans.toString());*/
				((JavascriptExecutor) driver).executeScript(DOMModifierFunctions+" return changeText();");
				/*ans = ((JavascriptExecutor) driver).executeScript(DOMModifierFunctions+
						" return getElementByXpath(\"HTML/BODY/DIV[1]/DIV[1]/DIV[1]/SPAN[1]/SPAN[1]\").textContent;");
				System.out.println(ans.toString());*/
				break;
			}
		}
		
		public Boolean processRow(WebDriver driver, String[] row, DesiredCapabilities cap){
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
		        	loadPage(driver,url,determinize);

					char letter = ((char) ((int) 'a' + j));
			        int algorithmSubalgorithms = this.subalgorithms.get(j);
			        for(int i = 0; i<algorithmSubalgorithms; i++){
				        //load jquery if we need it and if we're on a new page
				        if (this.jquery){
					        String jqueryCode;
					        try{
								jqueryCode = new Scanner(new File("resources/jquery-1.10.2.min.js")).useDelimiter("\\Z").next();
							}
							catch(Exception e){print("Failed to open jquery file."); return true;}
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
				
				print(url + ": " + e.toString().split("\n")[0]);
				/*
				//this.writer.writeNext((url+"<,>"+e.toString().split("\n")[0]).split("<,>"));
				driver.quit();
				driver = newDriver(cap);
				*/
				return false;
			}
	        return true;
		}
		
		public class ProcessRow implements Callable<Boolean>{
		    private final WebDriver driver;
		    private final String[] row;
		    private final DesiredCapabilities cap;

		    public ProcessRow(WebDriver driver, String[] row, DesiredCapabilities cap) {
		        this.driver = driver;
		        this.row = row;
		        this.cap = cap;
		    }

		    public Boolean call() throws Exception {
		    	return processRow(driver,row,cap);
		    }
		}
		
	    public void run() {
			String PROXY = "localhost:1234";
			org.openqa.selenium.Proxy proxy = new org.openqa.selenium.Proxy();
			proxy.setHttpProxy(PROXY).setNoProxy("https:*");
			DesiredCapabilities cap = new DesiredCapabilities();
			cap.setCapability(CapabilityType.PROXY, proxy);
			
			WebDriver driver = newDriver(cap);

			if (driver instanceof JavascriptExecutor) {
				while (true) {
					String[] row = this.queue.pop();
					//System.out.println(Arrays.toString(row));
					if (row == null){
						break; //the queue is empty
					}
					
				   TimeLimiter limiter = new SimpleTimeLimiter();
				   
				   try {
					boolean driverOK = limiter.callWithTimeout(new ProcessRow(driver,row,cap), 125, TimeUnit.SECONDS, false);
					if (!driverOK){
						print("Replacing driver after !driverOK.");
						driver = replaceDriver(driver,cap);
						print(driver.toString());
						// Comment out this line for scailability test
						//this.queue.timeout();
					}
				    } catch (Exception e) {
						print(row[0] + ": " + e.toString().split("\n")[0]);
						print("Replacing driver after exception.");
						//this.writer.writeNext((url+"<,>"+e.toString().split("\n")[0]).split("<,>"));
						driver = replaceDriver(driver,cap);
						print(driver.toString());
						// Comment out this line for scailability test
						//this.queue.timeout();
					} finally {
						// Comment out this line for scailability test
						//this.queue.done();
					}	
				}
			}
			
	        //Close the browser
			print("Quiting driver at end of tasks.");
	        driver.quit();
	    }
		
		public String execToString(String command) throws Exception {
		    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
		    CommandLine commandline = CommandLine.parse(command);
		    DefaultExecutor exec = new DefaultExecutor();
		    PumpStreamHandler streamHandler = new PumpStreamHandler(outputStream);
		    exec.setStreamHandler(streamHandler);
		    exec.execute(commandline);
		    return(outputStream.toString());
		}
	}

	
	public static void main(String[] args) {
		String input1 = "resources/input-filtered-30.csv";
		//String input1 = "resources/input-baidu.csv";
		String javaScript1 = "resources/getXpaths.js";
		String output1 = "resources/xpaths-2.csv";

		String input2 = "resources/xpaths-2.csv";
		String javaScript2 = "resources/filter.js";
		String output2 = "resources/filteredXpaths-2.csv";

		String input3 = "resources/filteredXpaths-2.csv";
		String javaScript3 = "resources/nodeSaving.js";
		String output3 = "resources/savedNodes-2.csv";
		
		String input4 = "resources/savedNodes-2.csv";
		String javaScript4 = "resources/nodeRetrieving.js";
		String output4 = "resources/nodeRetrieval1-SameSession-2.csv";

		String output5 = "resources/nodeRetrieval2-DiffSessionButTemporallyClose-2.csv";
		
		String output6 = "resources/nodeRetrieval3-DiffSessionAndTemporallyFar-2.csv";
		
		
		Boolean jquery = false;
		int threads = 8;
		
		JavaScriptTestingParallelWorkStealing system = new JavaScriptTestingParallelWorkStealing();
		
		Boolean firstSession = true;
		
		if (firstSession){
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
		else{
			system.startSession();
			system.stage(input4,javaScript4,output6,jquery,threads);
			system.endSession();
		}
		        

	}

}
