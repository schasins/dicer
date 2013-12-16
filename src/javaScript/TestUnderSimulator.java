package javaScript;

public class TestUnderSimulator {

	public static void main(String[] args) {
		String input1 = "resources/yahoo-wiki.csv";
		String javaScript1 = "resources/getXpaths.js";
		String output1 = "resources/xpaths.csv";

		String input2 = "resources/xpaths.csv";
		String javaScript2 = "resources/filter.js";
		String output2 = "resources/filteredXpaths.csv";

		String input3 = "resources/filteredXpaths.csv";
		String javaScript3 = "resources/nodeSaving.js";
		String output3 = "resources/savedNodes.csv";
		
		String input4 = "resources/savedNodes.csv";
		String javaScript4 = "resources/nodeRetrieving.js";
		String output4 = "resources/nodeRetrieval-SameSession.csv";

		String output5 = "resources/nodeRetrieval-DiffSession1.csv";
		String output6 = "resources/nodeRetrieval-DiffSession2.csv";
		String output7 = "resources/nodeRetrieval-DiffSession3.csv";
		String output8 = "resources/nodeRetrieval-DiffSession4.csv";
		
		
		Boolean jquery = false;
		int threads = 4;
		
		long start,stop;
		JavaScriptTestingParallelWorkStealing system;
		
		// Session 0
		start = System.currentTimeMillis();
		system = new JavaScriptTestingParallelWorkStealing();
		system.startSession();
		system.stage(input1,javaScript1,output1,jquery,threads);
		system.stage(input2,javaScript2,output2,jquery,threads);
		system.stage(input3,javaScript3,output3,jquery,threads);
		system.stage(input4,javaScript4,output4,jquery,threads);
		stop = System.currentTimeMillis();
		System.out.print("TIME 0: ");
		System.out.println((stop-start)/1000);

		// Session 1
		System.out.println("MODIFY DOM #1");
		start = System.currentTimeMillis();
		system = new JavaScriptTestingParallelWorkStealing(1);
		system.stage(input4,javaScript4,output5,jquery,threads);
		stop = System.currentTimeMillis();
		System.out.print("TIME 1: ");
		System.out.println((stop-start)/1000);

		// Session 2
		System.out.println("MODIFY DOM #2");
		start = System.currentTimeMillis();
		system = new JavaScriptTestingParallelWorkStealing(2);
		system.stage(input4,javaScript4,output6,jquery,threads);
		stop = System.currentTimeMillis();
		System.out.print("TIME 2: ");
		System.out.println((stop-start)/1000);

		// Session 3
		System.out.println("MODIFY DOM #3");
		start = System.currentTimeMillis();
		system = new JavaScriptTestingParallelWorkStealing(3);
		system.stage(input4,javaScript4,output7,jquery,threads);
		stop = System.currentTimeMillis();
		System.out.print("TIME 3: ");
		System.out.println((stop-start)/1000);

		// Session 3
		System.out.println("MODIFY DOM #4");
		start = System.currentTimeMillis();
		system = new JavaScriptTestingParallelWorkStealing(4);
		system.stage(input4,javaScript4,output8,jquery,threads);
		stop = System.currentTimeMillis();
		System.out.print("TIME 4: ");
		System.out.println((stop-start)/1000);
		
		system.endSession();
	}

}
