package javaScript;

import java.io.FileReader;
import java.util.ArrayList;
import java.util.List;

import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.firefox.FirefoxDriver;

import au.com.bytecode.opencsv.CSVReader;

public class JavaScriptTesting {
	
	public static void main(String[] args) {
		List<String[]> rows = new ArrayList<String[]>();
		try {
			CSVReader reader = new CSVReader(new FileReader("resources/input.csv"));
		    rows = reader.readAll();
		}
		catch(Exception e){
			System.out.println("Failed to read input file");
		}
		
		String javaScriptFunction = "return document.title;";
		
		WebDriver driver = new FirefoxDriver();
		
		for (int i = 0; i<rows.size(); i++){
	        driver.get(rows.get(i)[0]);
			if (driver instanceof JavascriptExecutor) {
				Object ans = ((JavascriptExecutor) driver).executeScript(javaScriptFunction);
				System.out.println(ans);
			}
		}

        //Close the browser
        driver.quit();
	}

}
