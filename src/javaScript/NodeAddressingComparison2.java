package javaScript;

import java.text.SimpleDateFormat;
import java.util.Date;

public class NodeAddressingComparison2 {

	public static void main(String[] args) {

		String date = new SimpleDateFormat("dd-MM-yyyy-hh-mm").format(new Date());
		
		//String input1 = "resources/tables/nodeAddressingComparison2/urls-50.csv";
		String input1 = "resources/tables/nodeAddressingComparison2/urls-30.csv";
		//String input1 = "resources/tables/nodeAddressingComparison2/urls-1.csv";
		String javaScript1 = "resources/programs/nodeAddressingComparison2/getXpaths.js";
		String output1 = "resources/tables/nodeAddressingComparison2/stage1-xpaths"+"_"+date+".csv";

		String javaScript2 = "resources/programs/nodeAddressingComparison2/getNodeURLs.js";
		String output2 = "resources/tables/nodeAddressingComparison2/stage2-xpathsURLs"+"_"+date+".csv";
		
		String javaScript3 = "resources/programs/nodeAddressingComparison2/getFeatures.js";
		String output3 = "resources/tables/nodeAddressingComparison2/stage3-xpathsURLsFeatures"+"_"+date+".csv";
		
		Boolean jquery = false;
		int threads = 32;
		
		JavaScriptTestingParallelWorkStealing system = new JavaScriptTestingParallelWorkStealing();
		
		system.startSession();
		system.stage(input1,javaScript1,output1,jquery,threads);
		system.stage(output1,javaScript2,output2,jquery,threads);
		system.stage(output2,javaScript3,output3,jquery,threads);
		system.endSession();
	}

}
