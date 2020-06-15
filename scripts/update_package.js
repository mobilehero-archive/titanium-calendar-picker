// const template = require('./package_template.json');
const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');

const props = require('./properties.json');

// ---------------------------------------------------------
//    Configure package.json
// ---------------------------------------------------------

const package_template = fs.readFileSync(path.join(__dirname, 'package_template.json'), 'utf8');

let pkg = package_template;

_.forEach(_.keys(props), (key) => {
	const regex = new RegExp(`{{${key}}}`, 'g');
	pkg = pkg.replace(regex, props[key]);
});

fs.writeJsonSync('./package.json', JSON.parse(pkg), {spaces: '\t'});

// ---------------------------------------------------------
//    Configure readme.md
// ---------------------------------------------------------

const readme_path = path.join(__dirname, '..', 'readme.md');
const readme_template_path = path.join(__dirname, 'readme_template.md');
if (!fs.pathExistsSync(readme_path)) {

	const readme_template = fs.readFileSync(readme_template_path, 'utf8');

	let readme = readme_template;

	_.forEach(_.keys(props), (key) => {
		const regex = new RegExp(`{{${key}}}`, 'g');
		readme = readme.replace(regex, props[key]);
	});

	fs.writeFileSync('./readme.md', readme, {spaces: '\t'});
}
