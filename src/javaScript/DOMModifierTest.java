package javaScript;

public class DOMModifierTest {

	public static void main(String[] args) {
		String input1 = "resources/google.csv";
		String javaScript1 = "resources/titleExtractor.js";
		String output1 = "resources/google-out.csv";
		
		
		Boolean jquery = false;
		int threads = 1;
		
		JavaScriptTestingParallelWorkStealing system = new JavaScriptTestingParallelWorkStealing(2);
		system.startSession();
		system.stage(input1,javaScript1,output1,jquery,threads);
		system.endSession();
		

		/*String input2 = "resources/youtube.csv";
		String output2 = "resources/youtube-out.csv";
		
		JavaScriptTestingParallelWorkStealing system2 = new JavaScriptTestingParallelWorkStealing(3);
		system2.startSession();
		system2.stage(input2,javaScript1,output2,jquery,threads);
		system2.endSession();*/
		
		/*String input1 = "resources/youtube.csv";
		String javaScript1 = "resources/getXpaths.js";
		String output1 = "resources/xpaths";
		
		Boolean jquery = false;
		int threads = 1;
		
		JavaScriptTestingParallelWorkStealing system = new JavaScriptTestingParallelWorkStealing();
		system.startSession();
		system.stage(input1,javaScript1,output1+"0.csv",jquery,threads);
		system.endSession();

		System.out.println("\n>>> MOD 1");
		JavaScriptTestingParallelWorkStealing system1 = new JavaScriptTestingParallelWorkStealing(1);
		system1.startSession();
		system1.stage(input1,javaScript1,output1+"1.csv",jquery,threads);
		system1.endSession();

		System.out.println("\n>>> MOD 2");
		JavaScriptTestingParallelWorkStealing system2 = new JavaScriptTestingParallelWorkStealing(2);
		system2.startSession();
		system2.stage(input1,javaScript1,output1+"2.csv",jquery,threads);
		system2.endSession();

		System.out.println("\n>>> MOD 3");
		JavaScriptTestingParallelWorkStealing system3 = new JavaScriptTestingParallelWorkStealing(3);
		system3.startSession();
		system3.stage(input1,javaScript1,output1+"3.csv",jquery,threads);
		system3.endSession();*/
	}

}
