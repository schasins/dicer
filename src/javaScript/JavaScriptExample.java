package javaScript;

import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.firefox.FirefoxDriver;

public class JavaScriptExample {
	public static void main(String[] args) {
		WebDriver driver = new FirefoxDriver();

        // And now use this to visit Google
        driver.get("http://www.eecs.berkeley.edu/~mangpo/www/home.html");
			
		if (driver instanceof JavascriptExecutor) {
			System.out.println(
						((JavascriptExecutor) driver).
							//executeScript("return document.title;"));	
							//executeScript("return document.getElementsByClassName(\'subscribe\').length;"));
							executeScript("return document.getElementsByClassName(\'subscribe\')[0].innerText;"));
		}

        //Close the browser
        driver.quit();
	}
}