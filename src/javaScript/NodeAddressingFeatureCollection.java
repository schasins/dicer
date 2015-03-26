package javaScript;

import java.text.SimpleDateFormat;
import java.util.Date;

public class NodeAddressingFeatureCollection {

	public static void main(String[] args) {

		String date = new SimpleDateFormat("dd-MM-yyyy-hh-mm").format(new Date());
		
		//String input1 = "resources/tables/nodeAddressingComparison2/urls-50.csv";
		String input1 = "resources/tables/nodeAddressingComparison2/urls-30.csv";
		//String input1 = "resources/tables/nodeAddressingComparison2/urls-1.csv";
		String javaScript1 = "resources/programs/nodeAddressingComparison2/getFeatureNames.js";
		String output1 = "resources/tables/nodeAddressingComparison2/stage1-featureNames"+"_"+date+".csv";

		Boolean jquery = false;
		int threads = 32;
		
		JavaScriptTestingParallelWorkStealing system = new JavaScriptTestingParallelWorkStealing();
		
		system.startSession();
		system.stage(input1,javaScript1,output1,jquery,threads,40);
		system.endSession();
	}

}
