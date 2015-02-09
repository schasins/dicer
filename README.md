Dicer
================================

Dicer -- the DOM-Interacting Controlled Experiment Runner -- is a framework for running large-scale controlled web experiments.  It is ideal for comparing algorithms that take webpages as inputs.  In order to compare such algorithms fairly, an experimenter must hold webpages constant, even though real webpages are constantly changing.  Dicer provides a convenient way for experimenters to control for webpage changes.  During a Dicer session, Dicer controls for two crucial sources of webpage changes.  It controls for page changes that stem from server-level changes, and for page changes that arise from non-deterministic JavaScript.

Dicer is implemented as a Java library.  The API appears below.

| Method  | Description |
| ------------- | ------------- |
| startSession()  | Starts a new session  |
| endSession()  | Ends current session  |
| stage(String ip, String it, String ot) | Adds stage to the current session with input program from file ip, input table from file it, which will write to file ot. |

To use Dicer, you will also need our custom caching proxy server, available [here](https://github.com/mangpo/cacheall-proxy-server).
