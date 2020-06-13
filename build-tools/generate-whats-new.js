const gitlog = require("gitlog").default;
const fs = require("fs");
const ROOT = __dirname + "/../";
const options = {
  repo: ROOT,
};

let current = fs.readFileSync(`${ROOT}/src-data/whatsNew.json`, "utf-8");
let pkgRaw = fs.readFileSync(`${ROOT}/package.json`, "utf-8") || "{}";
let pkg = JSON.parse(pkgRaw);
let version = pkg.version;

const commits = gitlog(options);

let features = current.features || [];
let fixes = current.fixes || [];
let chores = current.chores || [];
let build_date = new Date();

commits.forEach((commit) => {
  if (commit.subject && commit.subject.search("fix:") > -1) {
    let title = commit.subject.replace("fix: ", "");
    if (!fixes.find((f) => f.version == version && f.title == title)) {
      fixes.push({ version, title });
    }
  }
  if (commit.subject && commit.subject.search("feat:") > -1) {
    let title = commit.subject.replace("feat: ", "");
    if (!features.find((f) => f.version == version && f.title == title)) {
      features.push({ version, title });
    }
  }
  if (commit.subject && commit.subject.search("chore:") > -1) {
    let title = commit.subject.replace("chore: ", "");
    if (!chores.find((f) => f.version == version && f.title == title)) {
      chores.push({ version, title });
    }
  }
});

fs.writeFileSync(`${ROOT}/src-data/whatsNew.json`, JSON.stringify({ features, fixes, chores, build_date }));