package javaScript;

import java.io.File;
import java.util.Scanner;
import java.util.concurrent.TimeUnit;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.support.ui.ExpectedCondition;
import org.openqa.selenium.support.ui.Wait;
import org.openqa.selenium.support.ui.WebDriverWait;

public class Test {
	
	 public static Boolean waitForPageLoaded(WebDriver driver, final String firstUrl) {
	     ExpectedCondition<Boolean> expectation = new ExpectedCondition<Boolean>() {
	        public Boolean apply(WebDriver driver) {
	          System.out.println("return document.url != '"+firstUrl+"'");
	          System.out.println(((JavascriptExecutor)driver).executeScript("return document.readyState == 'complete'"));
	          System.out.println(((JavascriptExecutor)driver).executeScript("return window.location.protocol + '//' + window.location.host + '/' + window.location.pathname != '"+firstUrl+"'"));
	          return ((JavascriptExecutor)driver).executeScript("return document.readyState == 'complete' && window.location.protocol + '//' + window.location.host + '/' + window.location.pathname != '"+firstUrl+"'").toString().equals("true");
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
	
	public static void main(String[] args){
		
		WebDriver driver = new FirefoxDriver();
		
		driver.manage().timeouts().setScriptTimeout(5, TimeUnit.SECONDS);
		
		driver.get("http://amazon.com");
		
		String jquery;
        try{
			jquery = new Scanner(new File("resources/jquery-1.10.2.min.js")).useDelimiter("\\Z").next();
		}
		catch(Exception e){System.out.println("Failed to open jquery file."); return;}
        ((JavascriptExecutor) driver).executeScript(jquery);
		
		JavascriptExecutor jse = (JavascriptExecutor)driver;
		String html1 = (String) jse.executeScript("return document.title;");
		System.out.println(html1);
		String url = (String) jse.executeScript("return window.location.protocol + '//' + window.location.host + '/' + window.location.pathname;");
		System.out.println(url);
		//$('#nav_exposed_anchor').click();
		
		//jse.executeAsyncScript("window.setTimeout(function(){return 'test';},0)");
		//driver.findElement(By.id("nav-signin-text")).click();
		//driver.findElement(By.id("nav-signin-text")).click();
		String html = (String) jse.executeScript("return $('#nav-signin-text').html()");
		System.out.println(html);
		jse.executeScript("$('#nav-signin-text').click()");
		
		//waitForPageLoaded(driver,url);
		String html2 = (String) jse.executeScript("return document.title;");
		System.out.println(html2);

        driver.quit();
	}
}
