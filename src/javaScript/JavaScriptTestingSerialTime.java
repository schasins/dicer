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

import com.google.common.base.Joiner;

import au.com.bytecode.opencsv.CSVReader;
import au.com.bytecode.opencsv.CSVWriter;

public class JavaScriptTestingSerialTime {
	
	public static void main(String[] args) {
		//Input 1
		List<String[]> rows = new ArrayList<String[]>();
		try {
			CSVReader reader = new CSVReader(new FileReader("resources/input.csv"), '\t');
		    rows = reader.readAll();
		}
		catch(Exception e){
			System.out.println("Failed to open input file.");
			return;
		}
		
		//Input 2
		String javaScriptFunction;
		try{
			javaScriptFunction = new Scanner(new File("resources/titleExtractor.js")).useDelimiter("\\Z").next();
		}
		catch(Exception e){System.out.println("Failed to open JavaScript input file."); return;}

		//Output
		String csv = args[0];
		//String csv = "resources/output-seq.csv";
		PrintWriter writer;
		try{
			writer = new PrintWriter(csv);
		}
		catch(Exception e){
			System.out.println("Failed to open output file.");
			return;
		}
		
		//Execution
		long t0 = System.currentTimeMillis();
		WebDriver driver = new FirefoxDriver();
		driver.manage().timeouts().pageLoadTimeout(10, TimeUnit.SECONDS);
		long t1 = System.currentTimeMillis();


		writer.println("url;title;start-up;load;execute");
		writer.println("LOAD;;" + String.valueOf(t1 - t0));
		
		for (int i = 0; i<rows.size(); i++){
			if (driver instanceof JavascriptExecutor) {
				String[] row = rows.get(i);
				String url = row[0];
				if (!url.startsWith("http")){url = "http://"+url;}
				try {
					long t2 = System.currentTimeMillis();
					System.out.println("before load");
					driver.get(url);
					System.out.println("after load");
					long t3 = System.currentTimeMillis();
				
					for(int j = 1; j < row.length; j++){
						row[j] = "'"+row[j]+"'";
					}
					String argString = Joiner.on(",").join(Arrays.copyOfRange(row, 1, row.length));
					Thread.sleep(3000);
					System.out.println("before execute");
					Object ans = ((JavascriptExecutor) driver).executeScript(javaScriptFunction+" return func2("+argString+");");
					long t4 = System.currentTimeMillis();
					System.out.println("after execute");
				
					String ansStr = url + ";" + ans.toString() + ";0;" + 
							String.valueOf(t3 - t2) + ";" + 
							String.valueOf(t4 - t3) + ";";
				
					writer.println(ansStr);
				}
				catch(WebDriverException e){
					System.out.println(url + ": " + e.toString());
					writer.println(url + ";" + e.toString().split("\n")[0]);
				} catch (InterruptedException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
		}
		
        //Close the browser
        driver.quit();
		long stop = System.currentTimeMillis();

		//Close output writer
		try{
			writer.println("TOTAL;" + String.valueOf(stop-t0)); 
			writer.close();
		}
		catch(Exception e){
			System.out.println("Not able to clear output file.");
		}
	}

}
