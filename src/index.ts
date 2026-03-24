import * as core from "@actions/core";
import fs from "fs";
import util from "util";
const readFileAsync = util.promisify(fs.readFile);

async function run() {
  const file_path: string = core.getInput("file_path");
  const prop_path: string = core.getInput("prop_path");
  const override_json: string = core.getInput("overrides_json");
  let pathArr: string[] = [];
  let or_json = null;

  if(override_json) {
    try {
      core.debug("parsing override json");
      or_json = JSON.parse(override_json);
      core.debug("override json below");
      core.debug(or_json.toString());
    } catch (error) {
      if (error instanceof Error) {
        core.setFailed(error);
      } else {
        core.setFailed("Unable to parse Override JSON");
      }
    }
  }

  if (prop_path) {
    pathArr = prop_path.split(".");
  }

  try {
    const buffer = await readFileAsync(file_path);
    let json = JSON.parse(buffer.toString());

    if (pathArr.length > 0) {
      json = pathArr.reduce(
        (obj, key) =>{
          const idxStrReg = key.match(/(\[)[0-9]+(])/);
          if(idxStrReg){
            const arrKey = key.replace(/(\[)[0-9]+(])/, "");
            const idxReg = idxStrReg[0].match(/[0-9]+/);
            if (idxReg){
              const idx = idxReg[0];
              return key && obj && obj[arrKey] !== "undefined" && obj[arrKey][idx] !== "undefined" ? obj[arrKey][idx] : undefined;
            }
          }
          return key && obj && obj[key] !== "undefined" ? obj[key] : undefined;
        },
        json
      );
    }
    if (json && typeof json === "object") {
      for (const key in json) {
        let value: string = json[key];
        if (or_json && or_json[key]) {
            value = or_json[key]
            core.debug("overriding "+key+" with "+value);
        }
        core.setOutput(key, value);
      }
    } else if (json) {
      core.setOutput("value", json);
    } else {
      core.setFailed(`can not find prop_path: ${prop_path} in json file.`);
    }
  } catch (error) {
    console.log(error);
    if (error instanceof Error) {
      core.setFailed(error);
    }
  }
}

run();
