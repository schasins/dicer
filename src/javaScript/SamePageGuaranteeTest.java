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
	
	static public List<String> unmatchedLines(String output1, String output2){
		List<String> first_lines = readFile(output1, Charset.forName("UTF-8"));
		List<String> second_lines = readFile(output1, Charset.forName("UTF-8"));
		List<String> unmatched = new ArrayList<String>();
		for (int i = 0; i<first_lines.size(); i++){
			String line = first_lines.get(i);
			if (!second_lines.contains(line)){
				unmatched.add(line);
			}
		}
		for (int i = 0; i<second_lines.size(); i++){
			String line = second_lines.get(i);
			if (!first_lines.contains(line)){
				unmatched.add(line);
			}
		}
		return unmatched;
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
		
		Boolean run = false;
		String fin = "";
		
		if (run){
			system = new JavaScriptTestingParallelWorkStealing("xpaths");
			system.startSession();
			system.stage(input1,javaScript1,output1,jquery,1);
			List<String> first_read = readFile(path_to_proxyserver+"content-type.csv", Charset.forName("UTF-8"));
			system.stage(input1,javaScript1,output2,jquery,1);
			List<String> second_read = readFile(path_to_proxyserver+"content-type.csv", Charset.forName("UTF-8"));
			System.out.println(first_read);
			fin += first_read;
			System.out.println(second_read);
			fin += second_read;
			system.endSession();
		}
		List<String> unmatched = unmatchedLines(output1,output2);
		System.out.println(unmatched);
		System.out.println(unmatched.size());
		System.out.println(fin);
		
		return;
	}

}
