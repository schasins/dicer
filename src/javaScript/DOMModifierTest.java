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
		

		String input2 = "resources/youtube.csv";
		String output2 = "resources/youtube-out.csv";
		
		JavaScriptTestingParallelWorkStealing system2 = new JavaScriptTestingParallelWorkStealing(3);
		system2.startSession();
		system2.stage(input2,javaScript1,output2,jquery,threads);
		system2.endSession();
	}

}
