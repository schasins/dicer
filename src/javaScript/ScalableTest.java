package javaScript;

public class ScalableTest {

	public static void main(String[] args) {
		String input1 = "resources/input-scalable.csv";
		String javaScript1 = "resources/titleExtractor.js";
		String output1 = "resources/titles-scalable.csv";
		
		Boolean jquery = false;
		int threads = 8;
		
		JavaScriptTestingParallelWorkStealing system = new JavaScriptTestingParallelWorkStealing();
		system.startSession();
		system.stage(input1,javaScript1,output1,jquery,threads);
		system.endSession();
	}

}
