# Create the list of files
files =	../../drupal.api.js/bin/drupal.api.js\
	../../bin/allplayers.js\
	../treeselect/lib/jquery.moreorless.js/jquery.moreorless.js\
	../treeselect/js/jquery.treeselect.js\
	../treeselect/js/jquery.chosentree.js\
	../group_select/js/group_select.js\
	js/group_finder.js

.DEFAULT_GOAL := all

all: js

# Perform a jsLint on all the files.
jslint: ${files}
	gjslint $^

# Create an aggregated js file and a compressed js file.
js: ${files}
	@echo "Generating aggregated bin/apci.groupfinder.js"
	@cat > bin/apci.groupfinder.js $^
	@echo "Generating compressed bin/apci.groupfinder.compressed.js"
	curl -s \
	  -d compilation_level=SIMPLE_OPTIMIZATIONS \
	  -d output_format=text \
	  -d output_info=compiled_code \
	  --data-urlencode "js_code@bin/apci.groupfinder.js" \
	  http://closure-compiler.appspot.com/compile \
	  > bin/apci.groupfinder.compressed.js
