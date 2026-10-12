// Generates the Apache JMeter test plan used for load testing the builder and
// generated-activity workflow. Run with: node generate-load-test.mjs
//
// The plan defines staged traffic levels (x1, x10, x100, x1000) and
// exercises the API surface the builder relies on:
//   - GET  /health                    (liveness / readiness)
//   - GET  /api/activities            (load saved word lists - builder input)
//   - POST /api/activities            (create an activity configuration)
//   - POST /api/events/generation     (record a generated activity output)
//   - GET  /api/metrics/dashboard     (observability reporting view)
//
// Host/port can be overridden at run time with -Jhost=... -Jport=...

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const I = "          ";

const levels = [
  { name: "x1 - Smoke", threads: 1, rampUp: 1, loops: 10, scheduler: false },
  { name: "x10 - Light", threads: 10, rampUp: 5, loops: 10, scheduler: false },
  { name: "x100 - Moderate", threads: 100, rampUp: 30, loops: 5, scheduler: true, duration: 180 },
  { name: "x1000 - Heavy", threads: 1000, rampUp: 60, loops: 3, scheduler: false },
];

function requestArguments(body) {
  if (body) {
    return `${I}  <boolProp name="HTTPSampler.postBodyRaw">true</boolProp>
${I}  <elementProp name="HTTPsampler.Arguments" elementType="Arguments">
${I}    <collectionProp name="Arguments.arguments">
${I}      <elementProp name="" elementType="HTTPArgument">
${I}        <boolProp name="HTTPArgument.always_encode">false</boolProp>
${I}        <stringProp name="Argument.value">${body}</stringProp>
${I}        <stringProp name="Argument.metadata">=</stringProp>
${I}      </elementProp>
${I}    </collectionProp>
${I}  </elementProp>`;
  }

  return `${I}  <boolProp name="HTTPSampler.postBodyRaw">false</boolProp>
${I}  <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">
${I}    <collectionProp name="Arguments.arguments"/>
${I}  </elementProp>`;
}

function sampler({ name, method, path, body, expectedCode }) {
  return `
${I}<HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="${name}" enabled="true">
${I}  <stringProp name="HTTPSampler.domain">\${HOST}</stringProp>
${I}  <stringProp name="HTTPSampler.port">\${PORT}</stringProp>
${I}  <stringProp name="HTTPSampler.protocol">\${PROTOCOL}</stringProp>
${I}  <stringProp name="HTTPSampler.path">${path}</stringProp>
${I}  <stringProp name="HTTPSampler.method">${method}</stringProp>
${I}  <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
${I}  <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
${requestArguments(body)}
${I}</HTTPSamplerProxy>
${I}<hashTree>
${I}  <HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="HTTP Header Manager" enabled="true">
${I}    <collectionProp name="HeaderManager.headers">
${I}      <elementProp name="" elementType="Header">
${I}        <stringProp name="Header.name">Content-Type</stringProp>
${I}        <stringProp name="Header.value">application/json</stringProp>
${I}      </elementProp>
${I}      <elementProp name="" elementType="Header">
${I}        <stringProp name="Header.name">Accept</stringProp>
${I}        <stringProp name="Header.value">application/json</stringProp>
${I}      </elementProp>
${I}    </collectionProp>
${I}  </HeaderManager>
${I}  <hashTree/>
${I}  <ResponseAssertion guiclass="AssertionGui" testclass="ResponseAssertion" testname="Assert response code ${expectedCode}" enabled="true">
${I}    <collectionProp name="Asserion.test_strings">
${I}      <stringProp name="49586">${expectedCode}</stringProp>
${I}    </collectionProp>
${I}    <stringProp name="Assertion.custom_message"></stringProp>
${I}    <stringProp name="Assertion.test_field">Assertion.response_code</stringProp>
${I}    <boolProp name="Assertion.assume_success">false</boolProp>
${I}    <intProp name="Assertion.test_type">8</intProp>
${I}  </ResponseAssertion>
${I}  <hashTree/>
${I}</hashTree>`;
}

function threadGroup(level) {
  const scheduler = level.scheduler
    ? `${I}  <boolProp name="ThreadGroup.scheduler">true</boolProp>
${I}  <stringProp name="ThreadGroup.duration">${level.duration}</stringProp>`
    : `${I}  <boolProp name="ThreadGroup.scheduler">false</boolProp>`;

  const createBody = `{"name":"LoadTest-${level.threads}u-\${__threadNum}-\${__time(,)}","type":"WORD_SEARCH","difficulty":"EASY","rows":10,"cols":10,"words":[{"phonemes":["k","\\u00e6","t"],"english":"cat"}]}`;

  const samplers = [
    sampler({ name: "01 GET /health", method: "GET", path: "/health", expectedCode: 200 }),
    sampler({ name: "02 GET /api/activities", method: "GET", path: "/api/activities", expectedCode: 200 }),
    sampler({ name: "03 POST /api/activities", method: "POST", path: "/api/activities", expectedCode: 201, body: createBody }),
    sampler({
      name: "04 POST /api/events/generation",
      method: "POST",
      path: "/api/events/generation",
      expectedCode: 201,
      body: '{"activityType":"WORD_SEARCH","status":"SUCCESS","source":"BUILDER","wordCount":3,"durationMs":250}',
    }),
    sampler({ name: "05 GET /api/metrics/dashboard", method: "GET", path: "/api/metrics/dashboard", expectedCode: 200 }),
  ].join("\n");

  return `
${I}<ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="${level.name}" enabled="true">
${I}  <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
${I}  <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlPanel" testclass="LoopController" testname="Loop Controller" enabled="true">
${I}    <boolProp name="LoopController.continue_forever">false</boolProp>
${I}    <stringProp name="LoopController.loops">${level.loops}</stringProp>
${I}  </elementProp>
${I}  <stringProp name="ThreadGroup.num_threads">${level.threads}</stringProp>
${I}  <stringProp name="ThreadGroup.ramp_time">${level.rampUp}</stringProp>
${scheduler}
${I}  <boolProp name="ThreadGroup.same_user_on_next_iteration">true</boolProp>
${I}</ThreadGroup>
${I}<hashTree>${samplers}
${I}</hashTree>`;
}

const listeners = `
${I}<ResultCollector guiclass="SummaryReport" testclass="ResultCollector" testname="Summary Report" enabled="true">
${I}  <boolProp name="ResultCollector.error_logging">false</boolProp>
${I}  <objProp>
${I}    <name>saveConfig</name>
${I}    <value class="SampleSaveConfiguration">
${I}      <time>true</time><latency>true</latency><timestamp>true</timestamp>
${I}      <success>true</success><label>true</label><code>true</code>
${I}      <message>true</message><threadName>true</threadName>
${I}      <dataType>true</dataType><encoding>false</encoding>
${I}      <assertions>true</assertions><subresults>true</subresults>
${I}      <responseData>false</responseData><samplerData>false</samplerData>
${I}      <xml>false</xml><fieldNames>true</fieldNames>
${I}      <responseHeaders>false</responseHeaders><requestHeaders>false</requestHeaders>
${I}      <responseDataOnError>false</responseDataOnError>
${I}      <saveAssertionResultsFailureMessage>true</saveAssertionResultsFailureMessage>
${I}      <assertionsResultsToSave>0</assertionsResultsToSave><bytes>true</bytes>
${I}      <sentBytes>true</sentBytes><url>false</url><threadCounts>true</threadCounts>
${I}      <idleTime>true</idleTime><connectTime>true</connectTime>
${I}    </value>
${I}  </objProp>
${I}  <stringProp name="filename"></stringProp>
${I}</ResultCollector>
${I}<hashTree/>
${I}<ResultCollector guiclass="ViewResultsFullVisualizer" testclass="ResultCollector" testname="View Results Tree" enabled="false">
${I}  <boolProp name="ResultCollector.error_logging">false</boolProp>
${I}  <objProp>
${I}    <name>saveConfig</name>
${I}    <value class="SampleSaveConfiguration">
${I}      <time>true</time><latency>true</latency><timestamp>true</timestamp>
${I}      <success>true</success><label>true</label><code>true</code>
${I}      <message>true</message><threadName>true</threadName>
${I}      <dataType>true</dataType><encoding>false</encoding>
${I}      <assertions>true</assertions><subresults>true</subresults>
${I}      <responseData>false</responseData><samplerData>false</samplerData>
${I}      <xml>false</xml><fieldNames>true</fieldNames>
${I}      <responseHeaders>false</responseHeaders><requestHeaders>false</requestHeaders>
${I}      <responseDataOnError>false</responseDataOnError>
${I}      <saveAssertionResultsFailureMessage>true</saveAssertionResultsFailureMessage>
${I}      <assertionsResultsToSave>0</assertionsResultsToSave><bytes>true</bytes>
${I}      <sentBytes>true</sentBytes><url>true</url><threadCounts>true</threadCounts>
${I}    </value>
${I}  </objProp>
${I}  <stringProp name="filename"></stringProp>
${I}</ResultCollector>
${I}<hashTree/>`;

const jmx = `<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.6.3">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="Phoneme Activity Builder - Load Test" enabled="true">
      <stringProp name="TestPlan.comments">Staged load test for the Wordle / Word Search builder and generated-activity workflow. Run: jmeter -n -t phoneme-builder-load-test.jmx -l results.jtl -e -o report</stringProp>
      <boolProp name="TestPlan.functional_mode">false</boolProp>
      <boolProp name="TestPlan.serialize_threadgroups">true</boolProp>
      <elementProp name="TestPlan.user_defined_variables" elementType="Arguments" guiclass="ArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">
        <collectionProp name="Arguments.arguments">
          <elementProp name="HOST" elementType="Argument">
            <stringProp name="Argument.name">HOST</stringProp>
            <stringProp name="Argument.value">\${__P(host,localhost)}</stringProp>
            <stringProp name="Argument.metadata">=</stringProp>
          </elementProp>
          <elementProp name="PORT" elementType="Argument">
            <stringProp name="Argument.name">PORT</stringProp>
            <stringProp name="Argument.value">\${__P(port,4000)}</stringProp>
            <stringProp name="Argument.metadata">=</stringProp>
          </elementProp>
          <elementProp name="PROTOCOL" elementType="Argument">
            <stringProp name="Argument.name">PROTOCOL</stringProp>
            <stringProp name="Argument.value">\${__P(protocol,http)}</stringProp>
            <stringProp name="Argument.metadata">=</stringProp>
          </elementProp>
        </collectionProp>
      </elementProp>
      <stringProp name="TestPlan.user_define_classpath"></stringProp>
    </TestPlan>
    <hashTree>${levels.map(threadGroup).join("\n")}
${listeners}
    </hashTree>
  </hashTree>
</jmeterTestPlan>
`;

const outputPath = join(dirname(fileURLToPath(import.meta.url)), "phoneme-builder-load-test.jmx");
writeFileSync(outputPath, jmx, "utf8");
console.log(`Wrote ${outputPath}`);
