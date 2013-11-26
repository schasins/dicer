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

public class JavaScriptTestingSerial {
	
	public static void main(String[] args) {
		//Input 1
		List<String[]> rows = new ArrayList<String[]>();
		try {
			CSVReader reader = new CSVReader(new FileReader("resources/input2.csv"), '\t');
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
		CSVWriter writer;
		try{
			String csv = "resources/output.csv";
			writer = new CSVWriter(new FileWriter(csv));
		}
		catch(Exception e){
			System.out.println("Failed to open output file.");
			return;
		}
		
		//jquery?
		Boolean useJquery = true;
		
		//verbose
		Boolean verbose = true;
		
		//Execution
		WebDriver driver = new FirefoxDriver();

		if (driver instanceof JavascriptExecutor) {
			for (int i = 0; i<rows.size(); i++){
				String[] row = rows.get(i);
				String url = row[0];
				if (!url.startsWith("http")){url = "http://"+url;}
		        driver.get(url);
		        
		        if (useJquery){
			        String jquery;
			        try{
						jquery = new Scanner(new File("resources/jquery-1.10.2.min.js")).useDelimiter("\\Z").next();
					}
					catch(Exception e){System.out.println("Failed to open jquery file."); return;}
			        ((JavascriptExecutor) driver).executeScript(jquery);
		        }
		        
		        for(int j = 1; j < row.length; j++){
		            row[j] = "'"+row[j]+"'";
		        }
				String argString = Joiner.on(",").join(Arrays.copyOfRange(row, 1, row.length));
				Object ans = ((JavascriptExecutor) driver).executeScript(javaScriptFunction+" return func("+argString+");");
				if(verbose){System.out.println(ans);}
				
				String [] ansArray = ans.toString().split("#"); 
				writer.writeNext(ansArray);
			}
		}
		
		//Close output writer
		try{writer.close();}catch(Exception e){System.out.println("Failed to close output file.");}
        //Close the browser
        driver.quit();
	}

}
