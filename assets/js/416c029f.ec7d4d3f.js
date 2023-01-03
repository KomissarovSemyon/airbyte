"use strict";(self.webpackChunkdocu=self.webpackChunkdocu||[]).push([[41104],{3905:(e,t,n)=>{n.d(t,{Zo:()=>p,kt:()=>d});var r=n(67294);function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function a(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?a(Object(n),!0).forEach((function(t){o(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):a(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,r,o=function(e,t){if(null==e)return{};var n,r,o={},a=Object.keys(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}var s=r.createContext({}),c=function(e){var t=r.useContext(s),n=t;return e&&(n="function"==typeof e?e(t):i(i({},t),e)),n},p=function(e){var t=c(e.components);return r.createElement(s.Provider,{value:t},e.children)},u={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},m=r.forwardRef((function(e,t){var n=e.components,o=e.mdxType,a=e.originalType,s=e.parentName,p=l(e,["components","mdxType","originalType","parentName"]),m=c(n),d=o,y=m["".concat(s,".").concat(d)]||m[d]||u[d]||a;return n?r.createElement(y,i(i({ref:t},p),{},{components:n})):r.createElement(y,i({ref:t},p))}));function d(e,t){var n=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var a=n.length,i=new Array(a);i[0]=m;var l={};for(var s in t)hasOwnProperty.call(t,s)&&(l[s]=t[s]);l.originalType=e,l.mdxType="string"==typeof e?e:o,i[1]=l;for(var c=2;c<a;c++)i[c]=n[c];return r.createElement.apply(null,i)}return r.createElement.apply(null,n)}m.displayName="MDXCreateElement"},81078:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>s,contentTitle:()=>i,default:()=>u,frontMatter:()=>a,metadata:()=>l,toc:()=>c});var r=n(87462),o=(n(67294),n(3905));const a={},i="Deploy Airbyte on Oracle Cloud",l={unversionedId:"deploying-airbyte/on-oci-vm",id:"deploying-airbyte/on-oci-vm",title:"Deploy Airbyte on Oracle Cloud",description:"This page guides you through deploying Airbyte Open Source on an Oracle Cloud Infrastructure (OCI) Virtual Machine (VM) Instance.",source:"@site/../docs/deploying-airbyte/on-oci-vm.md",sourceDirName:"deploying-airbyte",slug:"/deploying-airbyte/on-oci-vm",permalink:"/deploying-airbyte/on-oci-vm",draft:!1,editUrl:"https://github.com/airbytehq/airbyte/blob/master/docs/../docs/deploying-airbyte/on-oci-vm.md",tags:[],version:"current",frontMatter:{},sidebar:"mySidebar",previous:{title:"Deploy Airbyte on Plural",permalink:"/deploying-airbyte/on-plural"},next:{title:"Deploy Airbyte on DigitalOcean",permalink:"/deploying-airbyte/on-digitalocean-droplet"}},s={},c=[{value:"Prerequisites",id:"prerequisites",level:2},{value:"Set up the environment",id:"set-up-the-environment",level:2},{value:"Install and start Airbyte",id:"install-and-start-airbyte",level:2},{value:"Troubleshooting",id:"troubleshooting",level:2}],p={toc:c};function u(e){let{components:t,...n}=e;return(0,o.kt)("wrapper",(0,r.Z)({},p,n,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("h1",{id:"deploy-airbyte-on-oracle-cloud"},"Deploy Airbyte on Oracle Cloud"),(0,o.kt)("p",null,"This page guides you through deploying Airbyte Open Source on an ",(0,o.kt)("a",{parentName:"p",href:"https://docs.oracle.com/en-us/iaas/Content/Compute/Tasks/launchinginstance.htm#Creating_an_Instance"},"Oracle Cloud Infrastructure (OCI) Virtual Machine (VM) Instance"),"."),(0,o.kt)("admonition",{type:"info"},(0,o.kt)("p",{parentName:"admonition"},"These instructions have been tested on an Oracle Linux 7 instance.")),(0,o.kt)("h2",{id:"prerequisites"},"Prerequisites"),(0,o.kt)("p",null,"To deploy Airbyte Open Source on Oracle cloud:"),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},"Create an ",(0,o.kt)("a",{parentName:"li",href:"https://docs.oracle.com/en-us/iaas/Content/Compute/Tasks/launchinginstance.htm#Creating_an_Instance"},"OCI VM compute instance")),(0,o.kt)("li",{parentName:"ul"},"Allowlist a port for a CIDR range in the ",(0,o.kt)("a",{parentName:"li",href:"https://docs.oracle.com/en-us/iaas/Content/Network/Concepts/securitylists.htm"},"security list of your OCI VM Instance subnet")),(0,o.kt)("li",{parentName:"ul"},"Connect to the instance using a ",(0,o.kt)("a",{parentName:"li",href:"https://docs.oracle.com/en-us/iaas/Content/Bastion/Tasks/connectingtosessions.htm#connect-port-forwarding"},"bastion port forwarding session"))),(0,o.kt)("admonition",{type:"caution"},(0,o.kt)("p",{parentName:"admonition"},"For security reasons, we strongly recommend not having a Public IP for the Instance where you are running Airbyte.")),(0,o.kt)("h2",{id:"set-up-the-environment"},"Set up the environment"),(0,o.kt)("p",null,"Install Docker and Docker Compose on the VM:"),(0,o.kt)("ol",null,(0,o.kt)("li",{parentName:"ol"},"Install Docker")),(0,o.kt)("p",null,"In the terminal connected to your OCI Instance for Airbyte, run the following commands:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-bash"},"sudo yum update -y\n\nsudo yum install -y docker\n\nsudo service docker start\n\nsudo usermod -a -G docker $USER\n")),(0,o.kt)("ol",{start:2},(0,o.kt)("li",{parentName:"ol"},"Install Docker Compose")),(0,o.kt)("p",null,"In the terminal connected to your OCI Instance for Airbyte, run the following commands:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-bash"},"sudo wget https://github.com/docker/compose/releases/download/1.26.2/docker-compose-$(uname -s)-$(uname -m) -O /usr/local/bin/docker-compose\n\nsudo chmod +x /usr/local/bin/docker-compose\n\nsudo /usr/local/bin/docker-compose --version\n")),(0,o.kt)("h2",{id:"install-and-start-airbyte"},"Install and start Airbyte"),(0,o.kt)("p",null,"Download the Airbyte repository and deploy it on the VM:"),(0,o.kt)("ol",null,(0,o.kt)("li",{parentName:"ol"},(0,o.kt)("p",{parentName:"li"},"Run the following commands to clone the Airbyte repo:"),(0,o.kt)("pre",{parentName:"li"},(0,o.kt)("code",{parentName:"pre",className:"language-bash"},"mkdir airbyte && cd airbyte\n\nwget https://raw.githubusercontent.com/airbytehq/airbyte/master/{.env,docker-compose.yaml}\n"))),(0,o.kt)("li",{parentName:"ol"},(0,o.kt)("p",{parentName:"li"},"Run the following commands to get Airbyte running on your OCI VM instance using Docker compose:"),(0,o.kt)("pre",{parentName:"li"},(0,o.kt)("code",{parentName:"pre",className:"language-bash"},"\nwhich docker-compose\n\nsudo /usr/local/bin/docker-compose up -d\n\n"))),(0,o.kt)("li",{parentName:"ol"},(0,o.kt)("p",{parentName:"li"},"Open up a Browser and visit port 8000 - ",(0,o.kt)("a",{parentName:"p",href:"http://localhost:8000/"},"http://localhost:8000/")))),(0,o.kt)("p",null,"Alternatively, you can get Airbyte running on your OCI VM instance using a different approach."),(0,o.kt)("ol",null,(0,o.kt)("li",{parentName:"ol"},(0,o.kt)("p",{parentName:"li"},"In the terminal connected to your OCI Instance for Airbyte, run the command: "),(0,o.kt)("pre",{parentName:"li"},(0,o.kt)("code",{parentName:"pre",className:"language-bash"},"ssh opc@bastion-host-public-ip -i <private-key-file.key> -L 8000:oci-private-instance-ip:8000\n")),(0,o.kt)("p",{parentName:"li"},"Replace ",(0,o.kt)("inlineCode",{parentName:"p"},"<private-key-file.key>")," with the path to your private key.")),(0,o.kt)("li",{parentName:"ol"},(0,o.kt)("p",{parentName:"li"},"On your browser, visit port 8000 ",(0,o.kt)("a",{parentName:"p",href:"http://localhost:8000/"},"port 8000")))),(0,o.kt)("h2",{id:"troubleshooting"},"Troubleshooting"),(0,o.kt)("p",null,"If you encounter any issues, reach out to our community on ",(0,o.kt)("a",{parentName:"p",href:"https://slack.airbyte.com/"},"Slack"),"."))}u.isMDXComponent=!0}}]);