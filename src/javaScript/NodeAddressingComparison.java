package javaScript;

import java.text.SimpleDateFormat;
import java.util.Date;

public class NodeAddressingComparison {

	public static void main(String[] args) {
		//String input1 = "resources/tables/nodeAddressingComparison/urls-50.csv";
		//String input1 = "resources/tables/nodeAddressingComparison/urls-30.csv";
		String input1 = "resources/tables/nodeAddressingComparison/urls-1.csv";
		String javaScript1 = "resources/programs/nodeAddressingComparison/getXpaths.js";
		String output1 = "resources/tables/nodeAddressingComparison/stage1-xpaths.csv";

		String javaScript2 = "resources/programs/nodeAddressingComparison/filter.js";
		String output2 = "resources/tables/nodeAddressingComparison/stage2-filteredXpaths.csv";

		String javaScript3 = "resources/programs/nodeAddressingComparison/pldi-nodeSaving.js";
		String output3 = "resources/tables/nodeAddressingComparison/stage3-savedNodes.csv";
		//String output3 = "resources/tables/nodeAddressingComparison/stage3-savedNodes-truncated.csv";
		
		String javaScript4 = "resources/programs/nodeAddressingComparison/pldi-nodeRetrieving.js";
		String output4Start = "resources/tables/nodeAddressingComparison/stage4-nodeRetrieval";

		String javaScript5 = "resources/programs/nodeAddressingComparison/pldi-nodeChangeTracking.js";
		String output5Start = "resources/tables/nodeAddressingComparison/stage5-nodeChangeTracking";
		
		Boolean jquery = true;
		int threads = 32;
		
		JavaScriptTestingParallelWorkStealing system = new JavaScriptTestingParallelWorkStealing();
		
		Boolean firstSession = true;
		
		if (firstSession){
			system.startSession();
			system.stage(input1,javaScript1,output1,jquery,threads);
			system.stage(output1,javaScript2,output2,jquery,threads);
			system.stage(output2,javaScript3,output3,jquery,threads);
			system.endSession();
		}
		//run a test even if we're doing training, so we have a test very shortly after training
		String date = new SimpleDateFormat("dd-MM-yyyy-hh-mm").format(new Date());
		String output4 = output4Start+"_"+date+".csv";
		String output5 = output5Start+"_"+date+".csv";
		system.startSession();
		system.stage(output3,javaScript4,output4,jquery,threads);
		system.stage(output4,javaScript5,output5,jquery,threads);
		system.endSession();
	}

}
