Deployment Steps taken

Permissions:


cd /Users/sathya/web/python/adk/software-engineering-agents
./fix-permissions.sh

=======


Backend:


Now retry your deployment:

cd /Users/sathya/web/python/adk/software-engineering-agents/backend

gcloud run deploy sparktoship-api \
  --source . \
  --region=us-west1 \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_API_KEY=MY_API_KEY"

zsh: unknown username ' from backe'
Building using Dockerfile and deploying container to Cloud Run service [sparktoship-api] in project [sparktoship] region [us-west1]
OK Building and deploying new service... Done.                                                                                                                                                                 
  OK Validating Service...                                                                                                                                                                                     
  OK Uploading sources...                                                                                                                                                                                      
  OK Building Container... Logs are available at [https://console.cloud.google.com/cloud-build/builds;region=us-west1/a88d6631-1914-40c3-aa44-e8bb0862c880?project=480987910366].                              
  OK Creating Revision...                                                                                                                                                                                      
  OK Routing traffic...                                                                                                                                                                                        
  OK Setting IAM Policy...                                                                                                                                                                                     
Done.                                                                                                                                                                                                          
Service [sparktoship-api] revision [sparktoship-api-00001-d9c] has been deployed and is serving 100 percent of traffic.
Service URL: https://sparktoship-api-480987910366.us-west1.run.app
(software-engineering-agents) sathya@sathyananansair backend % 

========

Frontend:

(software-engineering-agents) sathya@sathyananansair backend % cd ../frontend
(software-engineering-agents) sathya@sathyananansair frontend % node -v
v22.19.0
(software-engineering-agents) sathya@sathyananansair frontend % export API_URL="https://sparktoship-api-480987910366.us-west1.run.app"
(software-engineering-agents) sathya@sathyananansair frontend % echo "VITE_API_BASE_URL=$API_URL" > .env.production
(software-engineering-agents) sathya@sathyananansair frontend % npm install

up to date, audited 2932 packages in 12s

299 packages are looking for funding
  run `npm fund` for details

190 vulnerabilities (7 low, 130 moderate, 47 high, 6 critical)

To address issues that do not require attention, run:
  npm audit fix

To address all issues possible (including breaking changes), run:
  npm audit fix --force

Some issues need review, and may require choosing
a different dependency.

Run `npm audit` for details.
(software-engineering-agents) sathya@sathyananansair frontend % npm run build

> frontend@0.0.0 build
> tsc && vite build

vite v4.5.14 building for production...
✓ 4153 modules transformed.
dist/index.html                                                0.43 kB │ gzip:   0.30 kB
dist/assets/index-179e67de.css                                58.90 kB │ gzip:   9.92 kB
dist/assets/array-9f3ba611.js                                  0.09 kB │ gzip:   0.10 kB
dist/assets/clone-ca1bc925.js                                  0.09 kB │ gzip:   0.11 kB
dist/assets/channel-156ccd1e.js                                0.11 kB │ gzip:   0.13 kB
dist/assets/init-77b53fdd.js                                   0.15 kB │ gzip:   0.13 kB
dist/assets/Tableau10-1b767f5e.js                              0.19 kB │ gzip:   0.18 kB
dist/assets/flowDiagram-v2-4f6560a1-aceb6f03.js                0.74 kB │ gzip:   0.41 kB
dist/assets/line-56951a49.js                                   0.95 kB │ gzip:   0.46 kB
dist/assets/ordinal-ba9b4969.js                                1.19 kB │ gzip:   0.57 kB
dist/assets/svgDrawCommon-b86b1483-a6e5391f.js                 1.33 kB │ gzip:   0.57 kB
dist/assets/path-53f90ab3.js                                   2.28 kB │ gzip:   0.99 kB
dist/assets/arc-60f5eedf.js                                    3.46 kB │ gzip:   1.49 kB
dist/assets/stateDiagram-v2-c2b004d7-763e8bff.js               4.86 kB │ gzip:   2.31 kB
dist/assets/classDiagram-v2-2358418a-3d7d6085.js               5.01 kB │ gzip:   2.21 kB
dist/assets/infoDiagram-8eee0895-1ab0fde2.js                   8.59 kB │ gzip:   3.23 kB
dist/assets/classDiagram-beda092f-85077e35.js                  9.24 kB │ gzip:   2.87 kB
dist/assets/styles-d45a18b0-36d750cc.js                       10.06 kB │ gzip:   3.69 kB
dist/assets/stateDiagram-1ecb1508-ae609834.js                 10.13 kB │ gzip:   3.50 kB
dist/assets/linear-67b5c5b4.js                                10.17 kB │ gzip:   4.25 kB
dist/assets/index-5325376f-8a781ee4.js                        11.99 kB │ gzip:   4.13 kB
dist/assets/pieDiagram-a8764435-76381295.js                   15.02 kB │ gzip:   5.62 kB
dist/assets/graph-cff0f9b5.js                                 18.00 kB │ gzip:   6.45 kB
dist/assets/sankeyDiagram-a04cb91d-792e2a6b.js                21.22 kB │ gzip:   7.71 kB
dist/assets/journeyDiagram-c64418c1-3e2f74f8.js               21.69 kB │ gzip:   7.64 kB
dist/assets/flowDiagram-50d868cf-d42028c6.js                  22.10 kB │ gzip:   7.15 kB
dist/assets/timeline-definition-faaaa080-7e4769da.js          22.63 kB │ gzip:   7.89 kB
dist/assets/requirementDiagram-08caed73-23537ac9.js           24.62 kB │ gzip:   8.44 kB
dist/assets/styles-ca3715f6-50d94c14.js                       26.43 kB │ gzip:   8.45 kB
dist/assets/quadrantDiagram-1e28029f-21c7eb1c.js              29.41 kB │ gzip:   8.32 kB
dist/assets/layout-63268293.js                                29.90 kB │ gzip:  10.74 kB
dist/assets/erDiagram-0228fc6a-9b6504de.js                    30.81 kB │ gzip:   9.98 kB
dist/assets/edges-96097737-20bb0c53.js                        34.49 kB │ gzip:   8.93 kB
dist/assets/xychartDiagram-f5964ef8-39298c8d.js               37.27 kB │ gzip:  10.40 kB
dist/assets/blockDiagram-c4efeb88-cab553ab.js                 37.80 kB │ gzip:  11.95 kB
dist/assets/styles-b4e223ce-94d28afd.js                       37.86 kB │ gzip:  12.58 kB
dist/assets/gitGraphDiagram-82fe8481-4fab6247.js              38.74 kB │ gzip:  11.57 kB
dist/assets/flowDb-c6c81e3f-8d8811fb.js                       46.77 kB │ gzip:  15.28 kB
dist/assets/createText-1719965b-0cabf82e.js                   60.07 kB │ gzip:  17.81 kB
dist/assets/ganttDiagram-a2739b55-2027a855.js                 60.14 kB │ gzip:  20.41 kB
dist/assets/c4Diagram-c83219d4-9c1b7a29.js                    68.41 kB │ gzip:  19.16 kB
dist/assets/sequenceDiagram-c5b8d532-98814bd3.js              84.13 kB │ gzip:  24.21 kB
dist/assets/katex-032facd7.js                                262.61 kB │ gzip:  77.47 kB
dist/assets/mindmap-definition-8da855dc-07a22fd2.js          542.40 kB │ gzip: 169.81 kB
dist/assets/flowchart-elk-definition-6af322e1-38e22346.js  1,448.98 kB │ gzip: 444.39 kB
dist/assets/index-7c63d394.js                              1,484.98 kB │ gzip: 479.86 kB

(!) Some chunks are larger than 500 kBs after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 14.90s
(software-engineering-agents) sathya@sathyananansair frontend % export BUCKET_NAME="sparktoship-frontend"
(software-engineering-agents) sathya@sathyananansair frontend % gsutil mb -l us-west1 gs://$BUCKET_NAME
Creating gs://sparktoship-frontend/...
(software-engineering-agents) sathya@sathyananansair frontend % gsutil web set -m index.html -e index.html gs://$BUCKET_NAME
Setting website configuration on gs://sparktoship-frontend/...
(software-engineering-agents) sathya@sathyananansair frontend % gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME
(software-engineering-agents) sathya@sathyananansair frontend % gsutil -m rsync -r -d dist gs://$BUCKET_NAME
Building synchronization state...
If you experience problems with multiprocessing on MacOS, they might be related to https://bugs.python.org/issue33725. You can disable multiprocessing by editing your .boto config or by adding the following flag to your command: `-o "GSUtil:parallel_process_count=1"`. Note that multithreading is still available even if you disable multiprocessing.

Starting synchronization...
If you experience problems with multiprocessing on MacOS, they might be related to https://bugs.python.org/issue33725. You can disable multiprocessing by editing your .boto config or by adding the following flag to your command: `-o "GSUtil:parallel_process_count=1"`. Note that multithreading is still available even if you disable multiprocessing.

Copying file://dist/assets/Tableau10-1b767f5e.js [Content-Type=application/javascript]...
Copying file://dist/assets/array-9f3ba611.js [Content-Type=application/javascript]...
Copying file://dist/assets/arc-60f5eedf.js [Content-Type=application/javascript]...
Copying file://dist/assets/blockDiagram-c4efeb88-cab553ab.js [Content-Type=application/javascript]...
Copying file://dist/assets/channel-156ccd1e.js [Content-Type=application/javascript]...
Copying file://dist/assets/clone-ca1bc925.js [Content-Type=application/javascript]...
Copying file://dist/assets/c4Diagram-c83219d4-9c1b7a29.js [Content-Type=application/javascript]...
Copying file://dist/assets/classDiagram-beda092f-85077e35.js [Content-Type=application/javascript]...
Copying file://dist/assets/edges-96097737-20bb0c53.js [Content-Type=application/javascript]...
Copying file://dist/assets/createText-1719965b-0cabf82e.js [Content-Type=application/javascript]...
Copying file://dist/assets/erDiagram-0228fc6a-9b6504de.js [Content-Type=application/javascript]...
Copying file://dist/assets/flowDiagram-50d868cf-d42028c6.js [Content-Type=application/javascript]...
Copying file://dist/assets/flowDb-c6c81e3f-8d8811fb.js [Content-Type=application/javascript]...
Copying file://dist/assets/flowDiagram-v2-4f6560a1-aceb6f03.js [Content-Type=application/javascript]...
Copying file://dist/assets/flowchart-elk-definition-6af322e1-38e22346.js [Content-Type=application/javascript]...
Copying file://dist/assets/classDiagram-v2-2358418a-3d7d6085.js [Content-Type=application/javascript]...
Copying file://dist/assets/graph-cff0f9b5.js [Content-Type=application/javascript]...
Copying file://dist/assets/gitGraphDiagram-82fe8481-4fab6247.js [Content-Type=application/javascript]...
Copying file://dist/assets/index-7c63d394.js [Content-Type=application/javascript]...
Copying file://dist/assets/index-5325376f-8a781ee4.js [Content-Type=application/javascript]...
Copying file://dist/assets/ganttDiagram-a2739b55-2027a855.js [Content-Type=application/javascript]...
Copying file://dist/assets/index-179e67de.css [Content-Type=text/css]...        
Copying file://dist/assets/infoDiagram-8eee0895-1ab0fde2.js [Content-Type=application/javascript]...
Copying file://dist/assets/journeyDiagram-c64418c1-3e2f74f8.js [Content-Type=application/javascript]...
Copying file://dist/assets/katex-032facd7.js [Content-Type=application/javascript]...
Copying file://dist/assets/line-56951a49.js [Content-Type=application/javascript]...
Copying file://dist/assets/init-77b53fdd.js [Content-Type=application/javascript]...
Copying file://dist/assets/linear-67b5c5b4.js [Content-Type=application/javascript]...
Copying file://dist/assets/layout-63268293.js [Content-Type=application/javascript]...
Copying file://dist/assets/mindmap-definition-8da855dc-07a22fd2.js [Content-Type=application/javascript]...
Copying file://dist/assets/ordinal-ba9b4969.js [Content-Type=application/javascript]...
Copying file://dist/assets/path-53f90ab3.js [Content-Type=application/javascript]...
Copying file://dist/assets/pieDiagram-a8764435-76381295.js [Content-Type=application/javascript]...
Copying file://dist/assets/requirementDiagram-08caed73-23537ac9.js [Content-Type=application/javascript]...
Copying file://dist/assets/sankeyDiagram-a04cb91d-792e2a6b.js [Content-Type=application/javascript]...
Copying file://dist/assets/quadrantDiagram-1e28029f-21c7eb1c.js [Content-Type=application/javascript]...
Copying file://dist/assets/sequenceDiagram-c5b8d532-98814bd3.js [Content-Type=application/javascript]...
Copying file://dist/assets/stateDiagram-1ecb1508-ae609834.js [Content-Type=application/javascript]...
Copying file://dist/assets/styles-b4e223ce-94d28afd.js [Content-Type=application/javascript]...
Copying file://dist/assets/stateDiagram-v2-c2b004d7-763e8bff.js [Content-Type=application/javascript]...
Copying file://dist/assets/styles-ca3715f6-50d94c14.js [Content-Type=application/javascript]...
Copying file://dist/assets/styles-d45a18b0-36d750cc.js [Content-Type=application/javascript]...
Copying file://dist/assets/timeline-definition-faaaa080-7e4769da.js [Content-Type=application/javascript]...
Copying file://dist/assets/svgDrawCommon-b86b1483-a6e5391f.js [Content-Type=application/javascript]...
Copying file://dist/assets/xychartDiagram-f5964ef8-39298c8d.js [Content-Type=application/javascript]...
Copying file://dist/logo-light.png [Content-Type=image/png]...                  
Copying file://dist/vite.svg [Content-Type=image/svg+xml]...
Copying file://dist/index.html [Content-Type=text/html]...                      
Copying file://dist/logo-dark.png [Content-Type=image/png]...                   
- [49/49 files][  4.6 MiB/  4.6 MiB] 100% Done                                  
Operation completed over 49 objects/4.6 MiB.                                     
(software-engineering-agents) sathya@sathyananansair frontend % gsutil ls gs://$BUCKET_NAME
gs://sparktoship-frontend/index.html
gs://sparktoship-frontend/logo-dark.png
gs://sparktoship-frontend/logo-light.png
gs://sparktoship-frontend/vite.svg
gs://sparktoship-frontend/assets/

=======

Load Balancer:

✅ Static IP Reserved: 35.241.14.255
✅ Frontend Backend Created (Cloud Storage)
✅ API Network Endpoint Group Created
✅ API Backend Service Created
✅ URL Map Created
✅ Path Matcher Added (routes /api/* to backend)
✅ SSL Certificate Created (status: PROVISIONING)
✅ HTTPS Proxy Created
✅ Forwarding Rule Created


(software-engineering-agents) sathya@sathyananansair frontend % gcloud compute addresses create sparktoship-ip --global
export STATIC_IP=$(gcloud compute addresses describe sparktoship-ip --global --format='value(address)')
echo "Static IP: $STATIC_IP"
API [compute.googleapis.com] not enabled on project [sparktoship]. Would you like to enable and retry (this will take a few minutes)? (y/N)?  y

Enabling service [compute.googleapis.com] on project [sparktoship]...
Operation "operations/acf.p2-480987910366-7514d2dc-b143-4758-bde3-2beae3e8d862" finished successfully.
Created [https://www.googleapis.com/compute/v1/projects/sparktoship/global/addresses/sparktoship-ip].
Static IP: 35.241.14.255
(software-engineering-agents) sathya@sathyananansair frontend % # Frontend backend
gcloud compute backend-buckets create sparktoship-frontend-backend \
  --gcs-bucket-name=$BUCKET_NAME --enable-cdn
zsh: command not found: #

Created [https://www.googleapis.com/compute/v1/projects/sparktoship/global/backendBuckets/sparktoship-frontend-backend].
NAME: sparktoship-frontend-backend
GCS_BUCKET_NAME: sparktoship-frontend
ENABLE_CDN: True
(software-engineering-agents) sathya@sathyananansair frontend % 
(software-engineering-agents) sathya@sathyananansair frontend % gcloud compute network-endpoint-groups create sparktoship-api-neg \
  --region=$REGION --network-endpoint-type=serverless --cloud-run-service=sparktoship-api
Created [https://www.googleapis.com/compute/v1/projects/sparktoship/regions/us-west1/networkEndpointGroups/sparktoship-api-neg].
Created network endpoint group [sparktoship-api-neg].
(software-engineering-agents) sathya@sathyananansair frontend % 
(software-engineering-agents) sathya@sathyananansair frontend % 
(software-engineering-agents) sathya@sathyananansair frontend % gcloud compute backend-services create sparktoship-api-backend --global
gcloud compute backend-services add-backend sparktoship-api-backend \
  --global --network-endpoint-group=sparktoship-api-neg --network-endpoint-group-region=$REGION
Created [https://www.googleapis.com/compute/v1/projects/sparktoship/global/backendServices/sparktoship-api-backend].
NAME: sparktoship-api-backend
BACKENDS: 
PROTOCOL: HTTP
Updated [https://www.googleapis.com/compute/v1/projects/sparktoship/global/backendServices/sparktoship-api-backend].
(software-engineering-agents) sathya@sathyananansair frontend % gcloud compute url-maps create sparktoship-lb --default-backend-bucket=sparktoship-frontend-backend
Created [https://www.googleapis.com/compute/v1/projects/sparktoship/global/urlMaps/sparktoship-lb].
NAME: sparktoship-lb
DEFAULT_SERVICE: backendBuckets/sparktoship-frontend-backend
(software-engineering-agents) sathya@sathyananansair frontend % gcloud compute url-maps add-path-matcher sparktoship-lb \
  --path-matcher-name=api-matcher \
  --default-backend-bucket=sparktoship-frontend-backend \
  --backend-service-path-rules="/api/*=sparktoship-api-backend"
Updated [https://www.googleapis.com/compute/v1/projects/sparktoship/global/urlMaps/sparktoship-lb].
(software-engineering-agents) sathya@sathyananansair frontend % gcloud compute ssl-certificates create sparktoship-ssl-cert \
  --domains=sparktoship.dev,www.sparktoship.dev --global
Created [https://www.googleapis.com/compute/v1/projects/sparktoship/global/sslCertificates/sparktoship-ssl-cert].
NAME: sparktoship-ssl-cert
TYPE: MANAGED
CREATION_TIMESTAMP: 2025-12-02T16:42:40.915-08:00
EXPIRE_TIME: 
REGION: 
MANAGED_STATUS: PROVISIONING

sparktoship.dev: PROVISIONING
www.sparktoship.dev: PROVISIONING

(software-engineering-agents) sathya@sathyananansair frontend % gcloud compute target-https-proxies create sparktoship-https-proxy \
  --url-map=sparktoship-lb --ssl-certificates=sparktoship-ssl-cert
Created [https://www.googleapis.com/compute/v1/projects/sparktoship/global/targetHttpsProxies/sparktoship-https-proxy].
NAME: sparktoship-https-proxy
SSL_CERTIFICATES: sparktoship-ssl-cert
URL_MAP: sparktoship-lb
REGION: 
CERTIFICATE_MAP: 
(software-engineering-agents) sathya@sathyananansair frontend % gcloud compute forwarding-rules create sparktoship-https-rule \
  --global --target-https-proxy=sparktoship-https-proxy \
  --address=sparktoship-ip --ports=443
Created [https://www.googleapis.com/compute/v1/projects/sparktoship/global/forwardingRules/sparktoship-https-rule].
(software-engineering-agents) sathya@sathyananansair frontend % 

=======

Building synchronization state...
If you experience problems with multiprocessing on MacOS, they might be related to https://bugs.python.org/issue33725. You can disable multiprocessing by editing your .boto config or by adding the following flag to your command: `-o "GSUtil:parallel_process_count=1"`. Note that multithreading is still available even if you disable multiprocessing.

Starting synchronization...
If you experience problems with multiprocessing on MacOS, they might be related to https://bugs.python.org/issue33725. You can disable multiprocessing by editing your .boto config or by adding the following flag to your command: `-o "GSUtil:parallel_process_count=1"`. Note that multithreading is still available even if you disable multiprocessing.

Copying file://dist/assets/Tableau10-1b767f5e.js [Content-Type=application/javascript]...
Copying file://dist/assets/array-9f3ba611.js [Content-Type=application/javascript]...
Copying file://dist/assets/arc-60f5eedf.js [Content-Type=application/javascript]...
Copying file://dist/assets/blockDiagram-c4efeb88-cab553ab.js [Content-Type=application/javascript]...
Copying file://dist/assets/channel-156ccd1e.js [Content-Type=application/javascript]...
Copying file://dist/assets/clone-ca1bc925.js [Content-Type=application/javascript]...
Copying file://dist/assets/c4Diagram-c83219d4-9c1b7a29.js [Content-Type=application/javascript]...
Copying file://dist/assets/classDiagram-beda092f-85077e35.js [Content-Type=application/javascript]...
Copying file://dist/assets/edges-96097737-20bb0c53.js [Content-Type=application/javascript]...
Copying file://dist/assets/createText-1719965b-0cabf82e.js [Content-Type=application/javascript]...
Copying file://dist/assets/erDiagram-0228fc6a-9b6504de.js [Content-Type=application/javascript]...
Copying file://dist/assets/flowDiagram-50d868cf-d42028c6.js [Content-Type=application/javascript]...
Copying file://dist/assets/flowDb-c6c81e3f-8d8811fb.js [Content-Type=application/javascript]...
Copying file://dist/assets/flowDiagram-v2-4f6560a1-aceb6f03.js [Content-Type=application/javascript]...
Copying file://dist/assets/flowchart-elk-definition-6af322e1-38e22346.js [Content-Type=application/javascript]...
Copying file://dist/assets/classDiagram-v2-2358418a-3d7d6085.js [Content-Type=application/javascript]...
Copying file://dist/assets/graph-cff0f9b5.js [Content-Type=application/javascript]...
Copying file://dist/assets/gitGraphDiagram-82fe8481-4fab6247.js [Content-Type=application/javascript]...
Copying file://dist/assets/index-7c63d394.js [Content-Type=application/javascript]...
Copying file://dist/assets/index-5325376f-8a781ee4.js [Content-Type=application/javascript]...
Copying file://dist/assets/ganttDiagram-a2739b55-2027a855.js [Content-Type=application/javascript]...
Copying file://dist/assets/index-179e67de.css [Content-Type=text/css]...        
Copying file://dist/assets/infoDiagram-8eee0895-1ab0fde2.js [Content-Type=application/javascript]...
Copying file://dist/assets/journeyDiagram-c64418c1-3e2f74f8.js [Content-Type=application/javascript]...
Copying file://dist/assets/katex-032facd7.js [Content-Type=application/javascript]...
Copying file://dist/assets/line-56951a49.js [Content-Type=application/javascript]...
Copying file://dist/assets/init-77b53fdd.js [Content-Type=application/javascript]...
Copying file://dist/assets/linear-67b5c5b4.js [Content-Type=application/javascript]...
Copying file://dist/assets/layout-63268293.js [Content-Type=application/javascript]...
Copying file://dist/assets/mindmap-definition-8da855dc-07a22fd2.js [Content-Type=application/javascript]...
Copying file://dist/assets/ordinal-ba9b4969.js [Content-Type=application/javascript]...
Copying file://dist/assets/path-53f90ab3.js [Content-Type=application/javascript]...
Copying file://dist/assets/pieDiagram-a8764435-76381295.js [Content-Type=application/javascript]...
Copying file://dist/assets/requirementDiagram-08caed73-23537ac9.js [Content-Type=application/javascript]...
Copying file://dist/assets/sankeyDiagram-a04cb91d-792e2a6b.js [Content-Type=application/javascript]...
Copying file://dist/assets/quadrantDiagram-1e28029f-21c7eb1c.js [Content-Type=application/javascript]...
Copying file://dist/assets/sequenceDiagram-c5b8d532-98814bd3.js [Content-Type=application/javascript]...
Copying file://dist/assets/stateDiagram-1ecb1508-ae609834.js [Content-Type=application/javascript]...
Copying file://dist/assets/styles-b4e223ce-94d28afd.js [Content-Type=application/javascript]...
Copying file://dist/assets/stateDiagram-v2-c2b004d7-763e8bff.js [Content-Type=application/javascript]...
Copying file://dist/assets/styles-ca3715f6-50d94c14.js [Content-Type=application/javascript]...
Copying file://dist/assets/styles-d45a18b0-36d750cc.js [Content-Type=application/javascript]...
Copying file://dist/assets/timeline-definition-faaaa080-7e4769da.js [Content-Type=application/javascript]...
Copying file://dist/assets/svgDrawCommon-b86b1483-a6e5391f.js [Content-Type=application/javascript]...
Copying file://dist/assets/xychartDiagram-f5964ef8-39298c8d.js [Content-Type=application/javascript]...
Copying file://dist/logo-light.png [Content-Type=image/png]...                  
Copying file://dist/vite.svg [Content-Type=image/svg+xml]...
Copying file://dist/index.html [Content-Type=text/html]...                      
Copying file://dist/logo-dark.png [Content-Type=image/png]...                   
- [49/49 files][  4.6 MiB/  4.6 MiB] 100% Done                                  
Operation completed over 49 objects/4.6 MiB.                                     
(software-engineering-agents) sathya@sathyananansair frontend % gsutil ls gs://$BUCKET_NAME
gs://sparktoship-frontend/index.html
gs://sparktoship-frontend/logo-dark.png
gs://sparktoship-frontend/logo-light.png
gs://sparktoship-frontend/vite.svg
gs://sparktoship-frontend/assets/
(software-engineering-agents) sathya@sathyananansair frontend % gcloud compute addresses create sparktoship-ip --global
export STATIC_IP=$(gcloud compute addresses describe sparktoship-ip --global --format='value(address)')
echo "Static IP: $STATIC_IP"
API [compute.googleapis.com] not enabled on project [sparktoship]. Would you like to enable and retry (this will take a few minutes)? (y/N)?  y

Enabling service [compute.googleapis.com] on project [sparktoship]...
Operation "operations/acf.p2-480987910366-7514d2dc-b143-4758-bde3-2beae3e8d862" finished successfully.
Created [https://www.googleapis.com/compute/v1/projects/sparktoship/global/addresses/sparktoship-ip].
Static IP: 35.241.14.255
(software-engineering-agents) sathya@sathyananansair frontend % # Frontend backend
gcloud compute backend-buckets create sparktoship-frontend-backend \
  --gcs-bucket-name=$BUCKET_NAME --enable-cdn
zsh: command not found: #

Created [https://www.googleapis.com/compute/v1/projects/sparktoship/global/backendBuckets/sparktoship-frontend-backend].
NAME: sparktoship-frontend-backend
GCS_BUCKET_NAME: sparktoship-frontend
ENABLE_CDN: True
(software-engineering-agents) sathya@sathyananansair frontend % 
(software-engineering-agents) sathya@sathyananansair frontend % gcloud compute network-endpoint-groups create sparktoship-api-neg \
  --region=$REGION --network-endpoint-type=serverless --cloud-run-service=sparktoship-api
Created [https://www.googleapis.com/compute/v1/projects/sparktoship/regions/us-west1/networkEndpointGroups/sparktoship-api-neg].
Created network endpoint group [sparktoship-api-neg].
(software-engineering-agents) sathya@sathyananansair frontend % 
(software-engineering-agents) sathya@sathyananansair frontend % 
(software-engineering-agents) sathya@sathyananansair frontend % gcloud compute backend-services create sparktoship-api-backend --global
gcloud compute backend-services add-backend sparktoship-api-backend \
  --global --network-endpoint-group=sparktoship-api-neg --network-endpoint-group-region=$REGION
Created [https://www.googleapis.com/compute/v1/projects/sparktoship/global/backendServices/sparktoship-api-backend].
NAME: sparktoship-api-backend
BACKENDS: 
PROTOCOL: HTTP
Updated [https://www.googleapis.com/compute/v1/projects/sparktoship/global/backendServices/sparktoship-api-backend].
(software-engineering-agents) sathya@sathyananansair frontend % gcloud compute url-maps create sparktoship-lb --default-backend-bucket=sparktoship-frontend-backend
Created [https://www.googleapis.com/compute/v1/projects/sparktoship/global/urlMaps/sparktoship-lb].
NAME: sparktoship-lb
DEFAULT_SERVICE: backendBuckets/sparktoship-frontend-backend
(software-engineering-agents) sathya@sathyananansair frontend % gcloud compute url-maps add-path-matcher sparktoship-lb \
  --path-matcher-name=api-matcher \
  --default-backend-bucket=sparktoship-frontend-backend \
  --backend-service-path-rules="/api/*=sparktoship-api-backend"
Updated [https://www.googleapis.com/compute/v1/projects/sparktoship/global/urlMaps/sparktoship-lb].
(software-engineering-agents) sathya@sathyananansair frontend % gcloud compute ssl-certificates create sparktoship-ssl-cert \
  --domains=sparktoship.dev,www.sparktoship.dev --global
Created [https://www.googleapis.com/compute/v1/projects/sparktoship/global/sslCertificates/sparktoship-ssl-cert].
NAME: sparktoship-ssl-cert
TYPE: MANAGED
CREATION_TIMESTAMP: 2025-12-02T16:42:40.915-08:00
EXPIRE_TIME: 
REGION: 
MANAGED_STATUS: PROVISIONING

sparktoship.dev: PROVISIONING
www.sparktoship.dev: PROVISIONING

(software-engineering-agents) sathya@sathyananansair frontend % gcloud compute target-https-proxies create sparktoship-https-proxy \
  --url-map=sparktoship-lb --ssl-certificates=sparktoship-ssl-cert
Created [https://www.googleapis.com/compute/v1/projects/sparktoship/global/targetHttpsProxies/sparktoship-https-proxy].
NAME: sparktoship-https-proxy
SSL_CERTIFICATES: sparktoship-ssl-cert
URL_MAP: sparktoship-lb
REGION: 
CERTIFICATE_MAP: 
(software-engineering-agents) sathya@sathyananansair frontend % gcloud compute forwarding-rules create sparktoship-https-rule \
  --global --target-https-proxy=sparktoship-https-proxy \
  --address=sparktoship-ip --ports=443
Created [https://www.googleapis.com/compute/v1/projects/sparktoship/global/forwardingRules/sparktoship-https-rule].
(software-engineering-agents) sathya@sathyananansair frontend % 
(software-engineering-agents) sathya@sathyananansair frontend % 
(software-engineering-agents) sathya@sathyananansair frontend % 
(software-engineering-agents) sathya@sathyananansair frontend % gcloud compute ssl-certificates describe sparktoship-ssl-cert \
  --global --format='get(managed.status)'
PROVISIONING
(software-engineering-agents) sathya@sathyananansair frontend % gcloud compute ssl-certificates describe sparktoship-ssl-cert \
  --global --format='get(managed.status)'
PROVISIONING
(software-engineering-agents) sathya@sathyananansair frontend % gcloud compute ssl-certificates describe sparktoship-ssl-cert \
  --global --format='get(managed.status)'
PROVISIONING
(software-engineering-agents) sathya@sathyananansair frontend % dig +short sparktoship.dev @8.8.8.8
35.241.14.255
(software-engineering-agents) sathya@sathyananansair frontend % dig +short www.sparktoship.dev @8.8.8.8
(software-engineering-agents) sathya@sathyananansair frontend % dig +short www.sparktoship.dev @8.8.8.8
(software-engineering-agents) sathya@sathyananansair frontend % dig +short www.sparktoship.dev @8.8.8.8
(software-engineering-agents) sathya@sathyananansair frontend % dig +short www.sparktoship.dev @8.8.8.8
(software-engineering-agents) sathya@sathyananansair frontend % gcloud compute ssl-certificates describe sparktoship-ssl-cert \
  --global --format='get(managed.status)'
PROVISIONING
(software-engineering-agents) sathya@sathyananansair frontend % gcloud compute ssl-certificates describe sparktoship-ssl-cert \
  --global --format='get(managed.status)'
PROVISIONING
(software-engineering-agents) sathya@sathyananansair frontend % # Check if Load Balancer can reach your domain
curl -I http://35.241.14.255
zsh: command not found: #
curl: (56) Recv failure: Connection reset by peer
(software-engineering-agents) sathya@sathyananansair frontend % curl -I http://35.241.14.255
curl: (56) Recv failure: Connection reset by peer
(software-engineering-agents) sathya@sathyananansair frontend % dig +short www.sparktoship.dev @8.8.8.8                        
sparktoship.dev.
35.241.14.255
(software-engineering-agents) sathya@sathyananansair frontend % gcloud compute ssl-certificates describe sparktoship-ssl-cert \
  --global --format='get(managed.status)'
PROVISIONING
(software-engineering-agents) sathya@sathyananansair frontend % curl -I http://35.241.14.255                                   
curl: (56) Recv failure: Connection reset by peer
(software-engineering-agents) sathya@sathyananansair frontend % # Check status every 10 minutes
gcloud compute ssl-certificates describe sparktoship-ssl-cert \
  --global --format='get(managed.status)'
zsh: command not found: #
PROVISIONING
(software-engineering-agents) sathya@sathyananansair frontend % 
(software-engineering-agents) sathya@sathyananansair frontend % 
(software-engineering-agents) sathya@sathyananansair frontend % 
(software-engineering-agents) sathya@sathyananansair frontend % echo "VITE_API_BASE_URL=https://sparktoship.dev/api" > .env.production

(software-engineering-agents) sathya@sathyananansair frontend % npm run build


> frontend@0.0.0 build
> tsc && vite build

vite v4.5.14 building for production...
✓ 4153 modules transformed.
dist/index.html                                                0.43 kB │ gzip:   0.30 kB
dist/assets/index-179e67de.css                                58.90 kB │ gzip:   9.92 kB
dist/assets/array-9f3ba611.js                                  0.09 kB │ gzip:   0.10 kB
dist/assets/clone-ca1bc925.js                                  0.09 kB │ gzip:   0.11 kB
dist/assets/channel-156ccd1e.js                                0.11 kB │ gzip:   0.13 kB
dist/assets/init-77b53fdd.js                                   0.15 kB │ gzip:   0.13 kB
dist/assets/Tableau10-1b767f5e.js                              0.19 kB │ gzip:   0.18 kB
dist/assets/flowDiagram-v2-4f6560a1-aceb6f03.js                0.74 kB │ gzip:   0.41 kB
dist/assets/line-56951a49.js                                   0.95 kB │ gzip:   0.46 kB
dist/assets/ordinal-ba9b4969.js                                1.19 kB │ gzip:   0.57 kB
dist/assets/svgDrawCommon-b86b1483-a6e5391f.js                 1.33 kB │ gzip:   0.57 kB
dist/assets/path-53f90ab3.js                                   2.28 kB │ gzip:   0.99 kB
dist/assets/arc-60f5eedf.js                                    3.46 kB │ gzip:   1.49 kB
dist/assets/stateDiagram-v2-c2b004d7-763e8bff.js               4.86 kB │ gzip:   2.31 kB
dist/assets/classDiagram-v2-2358418a-3d7d6085.js               5.01 kB │ gzip:   2.21 kB
dist/assets/infoDiagram-8eee0895-1ab0fde2.js                   8.59 kB │ gzip:   3.23 kB
dist/assets/classDiagram-beda092f-85077e35.js                  9.24 kB │ gzip:   2.87 kB
dist/assets/styles-d45a18b0-36d750cc.js                       10.06 kB │ gzip:   3.69 kB
dist/assets/stateDiagram-1ecb1508-ae609834.js                 10.13 kB │ gzip:   3.50 kB
dist/assets/linear-67b5c5b4.js                                10.17 kB │ gzip:   4.25 kB
dist/assets/index-5325376f-8a781ee4.js                        11.99 kB │ gzip:   4.13 kB
dist/assets/pieDiagram-a8764435-76381295.js                   15.02 kB │ gzip:   5.62 kB
dist/assets/graph-cff0f9b5.js                                 18.00 kB │ gzip:   6.45 kB
dist/assets/sankeyDiagram-a04cb91d-792e2a6b.js                21.22 kB │ gzip:   7.71 kB
dist/assets/journeyDiagram-c64418c1-3e2f74f8.js               21.69 kB │ gzip:   7.64 kB
dist/assets/flowDiagram-50d868cf-d42028c6.js                  22.10 kB │ gzip:   7.15 kB
dist/assets/timeline-definition-faaaa080-7e4769da.js          22.63 kB │ gzip:   7.89 kB
dist/assets/requirementDiagram-08caed73-23537ac9.js           24.62 kB │ gzip:   8.44 kB
dist/assets/styles-ca3715f6-50d94c14.js                       26.43 kB │ gzip:   8.45 kB
dist/assets/quadrantDiagram-1e28029f-21c7eb1c.js              29.41 kB │ gzip:   8.32 kB
dist/assets/layout-63268293.js                                29.90 kB │ gzip:  10.74 kB
dist/assets/erDiagram-0228fc6a-9b6504de.js                    30.81 kB │ gzip:   9.98 kB
dist/assets/edges-96097737-20bb0c53.js                        34.49 kB │ gzip:   8.93 kB
dist/assets/xychartDiagram-f5964ef8-39298c8d.js               37.27 kB │ gzip:  10.40 kB
dist/assets/blockDiagram-c4efeb88-cab553ab.js                 37.80 kB │ gzip:  11.95 kB
dist/assets/styles-b4e223ce-94d28afd.js                       37.86 kB │ gzip:  12.58 kB
dist/assets/gitGraphDiagram-82fe8481-4fab6247.js              38.74 kB │ gzip:  11.57 kB
dist/assets/flowDb-c6c81e3f-8d8811fb.js                       46.77 kB │ gzip:  15.28 kB
dist/assets/createText-1719965b-0cabf82e.js                   60.07 kB │ gzip:  17.81 kB
dist/assets/ganttDiagram-a2739b55-2027a855.js                 60.14 kB │ gzip:  20.41 kB
dist/assets/c4Diagram-c83219d4-9c1b7a29.js                    68.41 kB │ gzip:  19.16 kB
dist/assets/sequenceDiagram-c5b8d532-98814bd3.js              84.13 kB │ gzip:  24.21 kB
dist/assets/katex-032facd7.js                                262.61 kB │ gzip:  77.47 kB
dist/assets/mindmap-definition-8da855dc-07a22fd2.js          542.40 kB │ gzip: 169.81 kB
dist/assets/flowchart-elk-definition-6af322e1-38e22346.js  1,448.98 kB │ gzip: 444.39 kB
dist/assets/index-7c63d394.js                              1,484.98 kB │ gzip: 479.86 kB

(!) Some chunks are larger than 500 kBs after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 17.47s
(software-engineering-agents) sathya@sathyananansair frontend % gsutil -m rsync -r -d dist gs://sparktoship-frontend

Building synchronization state...
If you experience problems with multiprocessing on MacOS, they might be related to https://bugs.python.org/issue33725. You can disable multiprocessing by editing your .boto config or by adding the following flag to your command: `-o "GSUtil:parallel_process_count=1"`. Note that multithreading is still available even if you disable multiprocessing.

Starting synchronization...
If you experience problems with multiprocessing on MacOS, they might be related to https://bugs.python.org/issue33725. You can disable multiprocessing by editing your .boto config or by adding the following flag to your command: `-o "GSUtil:parallel_process_count=1"`. Note that multithreading is still available even if you disable multiprocessing.

Copying file://dist/assets/Tableau10-1b767f5e.js [Content-Type=application/javascript]...
Copying file://dist/assets/arc-60f5eedf.js [Content-Type=application/javascript]...
Copying file://dist/assets/channel-156ccd1e.js [Content-Type=application/javascript]...
Copying file://dist/assets/edges-96097737-20bb0c53.js [Content-Type=application/javascript]...
Copying file://dist/assets/classDiagram-beda092f-85077e35.js [Content-Type=application/javascript]...
Copying file://dist/assets/c4Diagram-c83219d4-9c1b7a29.js [Content-Type=application/javascript]...
Copying file://dist/assets/array-9f3ba611.js [Content-Type=application/javascript]...
Copying file://dist/assets/classDiagram-v2-2358418a-3d7d6085.js [Content-Type=application/javascript]...
Copying file://dist/assets/clone-ca1bc925.js [Content-Type=application/javascript]...
Copying file://dist/assets/blockDiagram-c4efeb88-cab553ab.js [Content-Type=application/javascript]...
Copying file://dist/assets/flowDb-c6c81e3f-8d8811fb.js [Content-Type=application/javascript]...
Copying file://dist/assets/erDiagram-0228fc6a-9b6504de.js [Content-Type=application/javascript]...
Copying file://dist/assets/flowDiagram-50d868cf-d42028c6.js [Content-Type=application/javascript]...
Copying file://dist/assets/flowDiagram-v2-4f6560a1-aceb6f03.js [Content-Type=application/javascript]...
Copying file://dist/assets/flowchart-elk-definition-6af322e1-38e22346.js [Content-Type=application/javascript]...
Copying file://dist/assets/createText-1719965b-0cabf82e.js [Content-Type=application/javascript]...
Copying file://dist/assets/graph-cff0f9b5.js [Content-Type=application/javascript]...
Copying file://dist/assets/ganttDiagram-a2739b55-2027a855.js [Content-Type=application/javascript]...
Copying file://dist/assets/gitGraphDiagram-82fe8481-4fab6247.js [Content-Type=application/javascript]...
Copying file://dist/assets/index-179e67de.css [Content-Type=text/css]...
Copying file://dist/assets/index-5325376f-8a781ee4.js [Content-Type=application/javascript]...
Copying file://dist/assets/infoDiagram-8eee0895-1ab0fde2.js [Content-Type=application/javascript]...
Copying file://dist/assets/index-7c63d394.js [Content-Type=application/javascript]...
Copying file://dist/assets/init-77b53fdd.js [Content-Type=application/javascript]...
Copying file://dist/assets/journeyDiagram-c64418c1-3e2f74f8.js [Content-Type=application/javascript]...
Copying file://dist/assets/katex-032facd7.js [Content-Type=application/javascript]...
Copying file://dist/assets/line-56951a49.js [Content-Type=application/javascript]...
Copying file://dist/assets/layout-63268293.js [Content-Type=application/javascript]...
Copying file://dist/assets/linear-67b5c5b4.js [Content-Type=application/javascript]...
Copying file://dist/assets/mindmap-definition-8da855dc-07a22fd2.js [Content-Type=application/javascript]...
Copying file://dist/assets/ordinal-ba9b4969.js [Content-Type=application/javascript]...
Copying file://dist/assets/path-53f90ab3.js [Content-Type=application/javascript]...
Copying file://dist/assets/pieDiagram-a8764435-76381295.js [Content-Type=application/javascript]...
Copying file://dist/assets/quadrantDiagram-1e28029f-21c7eb1c.js [Content-Type=application/javascript]...
Copying file://dist/assets/requirementDiagram-08caed73-23537ac9.js [Content-Type=application/javascript]...
Copying file://dist/assets/sankeyDiagram-a04cb91d-792e2a6b.js [Content-Type=application/javascript]...
Copying file://dist/assets/sequenceDiagram-c5b8d532-98814bd3.js [Content-Type=application/javascript]...
Copying file://dist/assets/stateDiagram-v2-c2b004d7-763e8bff.js [Content-Type=application/javascript]...
Copying file://dist/assets/styles-b4e223ce-94d28afd.js [Content-Type=application/javascript]...
Copying file://dist/assets/styles-ca3715f6-50d94c14.js [Content-Type=application/javascript]...
Copying file://dist/assets/styles-d45a18b0-36d750cc.js [Content-Type=application/javascript]...
Copying file://dist/assets/stateDiagram-1ecb1508-ae609834.js [Content-Type=application/javascript]...
Copying file://dist/assets/svgDrawCommon-b86b1483-a6e5391f.js [Content-Type=application/javascript]...
Copying file://dist/assets/xychartDiagram-f5964ef8-39298c8d.js [Content-Type=application/javascript]...
Copying file://dist/assets/timeline-definition-faaaa080-7e4769da.js [Content-Type=application/javascript]...
Copying file://dist/index.html [Content-Type=text/html]...                      
Copying file://dist/logo-dark.png [Content-Type=image/png]...                   
Copying file://dist/logo-light.png [Content-Type=image/png]...                  
Copying file://dist/vite.svg [Content-Type=image/svg+xml]...                    
\ [49/49 files][  4.6 MiB/  4.6 MiB] 100% Done                                  
Operation completed over 49 objects/4.6 MiB.                                     
(software-engineering-agents) sathya@sathyananansair frontend % gcloud compute ssl-certificates describe sparktoship-ssl-cert \       
  --global --format='get(managed.status)'
ACTIVE
(software-engineering-agents) sathya@sathyananansair frontend % cd /Users/sathya/web/python/adk/software-engineering-agents
(software-engineering-agents) sathya@sathyananansair software-engineering-agents % chmod +x pause-sparktoship.sh resume-sparktoship.sh daily-cost-check.sh
(software-engineering-agents) sathya@sathyananansair software-engineering-agents % ./pause-sparktoship.sh
🛑 Pausing SparkToShip to save money...

⏸️  Pausing Load Balancer...
Deleted [https://www.googleapis.com/compute/v1/projects/sparktoship/global/forwardingRules/sparktoship-https-rule].
  ✓ Load Balancer paused
✓ Cloud Run scales to zero automatically (no action needed)

🤖 Checking for Vertex AI agents...
  ℹ️  No Vertex AI agents found

✅ SparkToShip paused successfully!

💰 Cost Savings:
   • Load Balancer: ~8/month saved
   • Vertex AI: ~./pause-sparktoship.sh-12/month saved
   • Current cost: ~/month (storage only)

💡 To resume: ./resume-sparktoship.sh

(software-engineering-agents) sathya@sathyananansair software-engineering-agents % ./daily-cost-check.sh
📊 SparkToShip Daily Cost Check
================================

🏃 Active Resources:
-------------------
✓ Cloud Run services: 1
URL: https://sparktoship-api-c4qcxu5ata-uw.a.run.app

  No Load Balancers (paused)

  No Vertex AI agents

💰 Estimated Daily Cost:
----------------------
Cloud Run: ~$0.17/day (with traffic)
Storage: ~$0.001/day

Total: ~$.171/day

📅 Projections:
--------------
Monthly: ~$5.130
Free credit lasts: ~58.4 months

✅ Cost is well optimized!

🔗 View detailed billing:
   https://console.cloud.google.com/billing

(software-engineering-agents) sathya@sathyananansair software-engineering-agents % ./daily-cost-check.sh
📊 SparkToShip Daily Cost Check
================================

🏃 Active Resources:
-------------------
✓ Cloud Run services: 1
URL: https://sparktoship-api-c4qcxu5ata-uw.a.run.app

  No Load Balancers (paused)

  No Vertex AI agents

💰 Estimated Daily Cost:
----------------------
Cloud Run: ~$0.17/day (with traffic)
Storage: ~$0.001/day

Total: ~$.171/day

📅 Projections:
--------------
Monthly: ~$5.130
Free credit lasts: ~58.4 months

✅ Cost is well optimized!

🔗 View detailed billing:
   https://console.cloud.google.com/billing

(software-engineering-agents) sathya@sathyananansair software-engineering-agents % ./resume-sparktoship.sh
▶️  Resuming SparkToShip...

🌐 Resuming Load Balancer...
Created [https://www.googleapis.com/compute/v1/projects/sparktoship/global/forwardingRules/sparktoship-https-rule].
  ✓ Load Balancer resumed
✓ Cloud Run is ready (auto-scales on demand)

✅ SparkToShip resumed successfully!

🌐 Your app is live at:
   https://sparktoship.dev

⏱️  Note: Load Balancer may take 1-2 minutes to fully activate

💰 Current cost: ~4/month (covered by free credit)
💡 To pause again: ./pause-sparktoship.sh

(software-engineering-agents) sathya@sathyananansair software-engineering-agents %