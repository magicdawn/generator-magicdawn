rm .eslintrc.yml* .prettierrc*
wget $DOT_FILES/eslint/2/.eslintrc.yml
wget $DOT_FILES/.prettierrc

cd app/templates;

rm .eslintrc.yml* .prettierrc* .travis.yml*
wget $DOT_FILES/eslint/2/.eslintrc.yml
wget $DOT_FILES/.prettierrc
wget $DOT_FILES/.travis.yml