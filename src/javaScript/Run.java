package javaScript;

public class Run {
	public static void main(String[] args) {
		String[] output = new String[1];
		output[0] = "resources/output-seq1.csv";
		JavaScriptTestingSerialTime.main(output);
		output[0] = "resources/output-seq2.csv";
		JavaScriptTestingSerialTime.main(output);
		output[0] = "resources/output-seq3.csv";
		JavaScriptTestingSerialTime.main(output);
		output[0] = "resources/output-seq4.csv";
		JavaScriptTestingSerialTime.main(output);
		output[0] = "resources/output-seq5.csv";
		JavaScriptTestingSerialTime.main(output);
		output[0] = "resources/output-loadbalance1.csv";
		JavaScriptTestingParallelWorkStealingTime.main(output);
		output[0] = "resources/output-loadbalance2.csv";
		JavaScriptTestingParallelWorkStealingTime.main(output);
		output[0] = "resources/output-loadbalance3.csv";
		JavaScriptTestingParallelWorkStealingTime.main(output);
		output[0] = "resources/output-loadbalance4.csv";
		JavaScriptTestingParallelWorkStealingTime.main(output);
		output[0] = "resources/output-loadbalance5.csv";
		JavaScriptTestingParallelWorkStealingTime.main(output);
		output[0] = "resources/output-split1.csv";
		JavaScriptTestingParallelSplitTime.main(output);
		output[0] = "resources/output-split2.csv";
		JavaScriptTestingParallelSplitTime.main(output);
		output[0] = "resources/output-split3.csv";
		JavaScriptTestingParallelSplitTime.main(output);
		output[0] = "resources/output-split4.csv";
		JavaScriptTestingParallelSplitTime.main(output);
		output[0] = "resources/output-split5.csv";
		JavaScriptTestingParallelSplitTime.main(output);
	}
}
