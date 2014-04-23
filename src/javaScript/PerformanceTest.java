package javaScript;

public class PerformanceTest {

	public static void main(String[] args) {
		String input1 = "resources/input.csv";
		String javaScript1 = "resources/titleExtractor.js";
		String output1 = "resources/loadbalance1.csv";
		String output2 = "resources/loadbalance2.csv";
		String output3 = "resources/loadbalance3.csv";
		String output4 = "resources/loadbalance4.csv";
		String output5 = "resources/loadbalance5.csv";
		
		Boolean jquery = false;
		int threads = 8;
		
		JavaScriptTestingParallelWorkStealing system = new JavaScriptTestingParallelWorkStealing();
		system.stage(input1,javaScript1,output1,jquery,threads);
		system.stage(input1,javaScript1,output2,jquery,threads);
		system.stage(input1,javaScript1,output3,jquery,threads);
		system.stage(input1,javaScript1,output4,jquery,threads);
		system.stage(input1,javaScript1,output5,jquery,threads);
	}

}
