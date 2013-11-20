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

public class JavaScriptTesting {
	
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
		String javaScriptFunction = "var func = function(a,b){return document.title+' - '+a+' - '+b;};";
		
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
		
		//Execution
		WebDriver driver = new FirefoxDriver();
		
		for (int i = 0; i<rows.size(); i++){
			if (driver instanceof JavascriptExecutor) {
				String[] row = rows.get(i);
		        driver.get(row[0]);
		        for(int j = 1; j < row.length; j++){
		            row[j] = "'"+row[j]+"'";
		        }
				String argString = Joiner.on(",").join(Arrays.copyOfRange(row, 1, row.length));
				Object ans = ((JavascriptExecutor) driver).executeScript(javaScriptFunction+" return func("+argString+");");
				
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
