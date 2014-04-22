package javaScript;

import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;


public class SamePageGuaranteeTest {
	
	static List<String> readFile(String path, Charset encoding) {
		List<String> lines;
		try {
			lines = Files.readAllLines(Paths.get(path), encoding);
			return lines;
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return new ArrayList<String>();
	}

	public static void main(String[] args) {

		String path_to_proxyserver = "/home/sarah/Dropbox/Berkeley/research/similarityAlgorithms/cacheall-proxy-server/";
		
		//String input1 = "resources/input-scalable-1000.csv";
		String input1 = "resources/input1-small.csv";
		String javaScript1 = "resources/getXpaths.js";
		String output1 = "resources/xpaths1.csv";
		String output2 = "resources/xpaths2.csv";
		
		Boolean jquery = false;
		JavaScriptTestingParallelWorkStealing system;
		
		system = new JavaScriptTestingParallelWorkStealing("xpaths");
		system.startSession();
		system.stage(input1,javaScript1,output1,jquery,1);
		List<String> first_read = readFile(path_to_proxyserver+"content-type.csv", Charset.forName("UTF-8"));
		system.stage(input1,javaScript1,output2,jquery,1);
		List<String> second_read = readFile(path_to_proxyserver+"content-type.csv", Charset.forName("UTF-8"));
		system.endSession();
		System.out.println(first_read);
		System.out.println(second_read);
		return;
	}

}
