require('@babel/register')()
require.extensions['.css'] = () => {
	return;
};

module.exports = () => {
}