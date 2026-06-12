const validateEmail = (email) => {
  const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateWorkspaceName = (name) => {
  return name && name.length >= 1 && name.length <= 50;
};

const validateChannelName = (name) => {
  return name && name.length >= 1 && name.length <= 30;
};

const validateMessage = (content) => {
  return content && content.length > 0 && content.length <= 2000;
};

module.exports = {
  validateEmail,
  validatePassword,
  validateWorkspaceName,
  validateChannelName,
  validateMessage
};