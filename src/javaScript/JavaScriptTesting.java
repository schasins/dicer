package javaScript;

import java.util.ArrayList;

import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.firefox.FirefoxDriver;

public class JavaScriptTesting {
	
	public static void main(String[] args) {
		ArrayList<String> urls = new ArrayList<String>();
		urls.add("http://google.com");
		urls.add("http://facebook.com");
		
		String javaScriptFunction = "return document.title;";
		
		WebDriver driver = new FirefoxDriver();
		
		for (int i = 0; i<urls.size(); i++){
	        driver.get(urls.get(i));
			if (driver instanceof JavascriptExecutor) {
				Object ans = ((JavascriptExecutor) driver).executeScript(javaScriptFunction);
				System.out.println(ans);
			}
		}

        //Close the browser
        driver.quit();
	}

}
