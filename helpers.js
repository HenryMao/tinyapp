const generateRandString = function(){
  let result = '';
  const alph = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for(let i = 0; i < 6; i++){
    result += alph.charAt(Math.floor(Math.random() * alph.length));
  }
  return result;
}

const findUser = function(email, users){
  for(let user in users){
    if(users[user].email === email){
      return user;
    }
  }
}

//given a userid returns an array of allowed/matching urls


module.exports = {findUser, generateRandString};
