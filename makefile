# To run this makefile, you must do the following.
#
# 1.)  sudo make tools -B
#

# Create the list of files
files =	drupal.api.js/bin/drupal.api.js\
	src/allplayers.date.js\
	src/allplayers.event.js\
	src/allplayers.group.js\
	src/allplayers.location.js\
	src/allplayers.calendar.js\
	lib/treeselect/lib/jquery.moreorless.js/jquery.moreorless.js\
	lib/treeselect/bin/jquery.treeselect.js\
	lib/group_select/js/group_select.js\
	lib/group_finder/js/group_finder.js

lintfiles = src/allplayers.date.js\
	src/allplayers.event.js\
	src/allplayers.group.js\
	src/allplayers.location.js\
	src/allplayers.calendar.js\
	src/allplayers.embed.js\
	src/allplayers.embed.server.js\
	src/allplayers.embed.client.js\
	lib/treeselect/lib/jquery.moreorless.js/jquery.moreorless.js\
	lib/treeselect/bin/jquery.treeselect.js\
	lib/group_select/js/group_select.js\
	lib/group_finder/js/group_finder.js

docfiles = drupal.api.js/src/drupal.api.js\
	drupal.api.js/src/drupal.system.js\
	drupal.api.js/src/drupal.entity.js\
	drupal.api.js/src/drupal.node.js\
	drupal.api.js/src/drupal.user.js\
	src/allplayers.date.js\
	src/allplayers.event.js\
	src/allplayers.group.js\
	src/allplayers.location.js\
	src/allplayers.calendar.js

embedserverfiles = src/allplayers.embed.js\
	src/allplayers.embed.server.js

embedclientfiles = src/allplayers.embed.js\
	src/allplayers.embed.client.js

.DEFAULT_GOAL := all

all: makecore jslint js getjson getporthole embedserver embedclient rmporthole

makecore:
	cd drupal.api.js; make -B; cd ..; cd lib/treeselect; make -B; cd ../..;

# Perform a jsLint on all the files.
jslint: ${lintfiles}
	gjslint $^

# Create an aggregated js file and a compressed js file.
js: ${files}
	@echo "Generating aggregated bin/allplayers.js"
	@cat > bin/allplayers.js $^
	@echo "Generating compressed bin/allplayers.compressed.js"
	curl -s \
	  -d compilation_level=SIMPLE_OPTIMIZATIONS \
	  -d output_format=text \
	  -d output_info=compiled_code \
	  --data-urlencode "js_code@bin/allplayers.js" \
	  http://closure-compiler.appspot.com/compile \
	  > bin/allplayers.compressed.js
	@echo "Generating compressed bin/allplayers.loader.js"
	curl -s \
	  -d compilation_level=SIMPLE_OPTIMIZATIONS \
	  -d output_format=text \
	  -d output_info=compiled_code \
	  --data-urlencode "js_code@src/allplayers.loader.js" \
	  http://closure-compiler.appspot.com/compile \
	  > bin/allplayers.loader.js

getjson:
	@curl https://raw.github.com/douglascrockford/JSON-js/master/json2.js > lib/json2.js

getporthole:
	@curl https://raw.github.com/ternarylabs/porthole/master/src/porthole.min.js > lib/porthole.min.js

embedserver: ${embedserverfiles}
	@echo "Generating allplayers.embed.server.js"
	@cat > bin/allplayers.embed.server.js lib/json2.js lib/porthole.min.js $^
	@echo "Generating allplayers.embed.server.min.js"
	curl -s \
	  -d compilation_level=SIMPLE_OPTIMIZATIONS \
	  -d output_format=text \
	  -d output_info=compiled_code \
	  --data-urlencode "js_code@bin/allplayers.embed.server.js" \
	  http://closure-compiler.appspot.com/compile \
	  > bin/allplayers.embed.server.min.js

embedclient: ${embedclientfiles}
	@echo "Generating allplayers.embed.client.js"
	@cat > bin/allplayers.embed.client.js lib/json2.js lib/porthole.min.js $^
	@echo "Generating allplayers.embed.client.min.js"
	curl -s \
	  -d compilation_level=SIMPLE_OPTIMIZATIONS \
	  -d output_format=text \
	  -d output_info=compiled_code \
	  --data-urlencode "js_code@bin/allplayers.embed.client.js" \
	  http://closure-compiler.appspot.com/compile \
	  > bin/allplayers.embed.client.min.js

rmporthole:
	@rm lib/porthole.min.js

# Create the documentation from source code.
jsdoc: ${docfiles}
	@echo "Generating documetation."
	@java -jar tools/jsdoc-toolkit/jsrun.jar tools/jsdoc-toolkit/app/run.js -a -t=tools/jsdoc-toolkit/templates/jsdoc -d=doc $^

# Fix the js style on all the files.
fixjsstyle: ${files}
	fixjsstyle $^

# Install the necessary tools.
tools:
	apt-get install python-setuptools
	apt-get install unzip
	easy_install http://closure-linter.googlecode.com/files/closure_linter-latest.tar.gz
	wget http://jsdoc-toolkit.googlecode.com/files/jsdoc_toolkit-2.4.0.zip -P tools
	unzip tools/jsdoc_toolkit-2.4.0.zip -d tools
	mv tools/jsdoc_toolkit-2.4.0/jsdoc-toolkit tools/jsdoc-toolkit
	rm -rd tools/jsdoc_toolkit-2.4.0
	rm tools/jsdoc_toolkit-2.4.0.zip
