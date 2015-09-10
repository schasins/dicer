package javaScript;

import java.io.IOException;

import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.firefox.FirefoxBinary;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxProfile;
import org.openqa.selenium.firefox.internal.ProfilesIni;
import org.openqa.selenium.remote.CapabilityType;
import org.openqa.selenium.remote.DesiredCapabilities;

public class JavaScriptExample {
	public static void main(String[] args) {

		String path_to_proxyserver = "/home/mangpo/work/262a/httpmessage/";
		Process p = null;
		try {
			p = Runtime.getRuntime().exec("python " + path_to_proxyserver + "proxyserv.py");
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		String PROXY = "localhost:1234";
		org.openqa.selenium.Proxy proxy = new org.openqa.selenium.Proxy();
		proxy.setHttpProxy(PROXY).setNoProxy("https:*");
		DesiredCapabilities cap = new DesiredCapabilities();
		cap.setCapability(CapabilityType.PROXY, proxy);
		
		FirefoxProfile profile = new ProfilesIni().getProfile("default");
        profile.setPreference("network.cookie.cookieBehavior", 2);
        WebDriver driver = new FirefoxDriver(new FirefoxBinary(), profile, cap, cap);

        driver.get("http://www.amazon.com");
        driver.quit();
        
        p.destroy();
	}
}