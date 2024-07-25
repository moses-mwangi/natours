///////THE FUNCTION METHOD TO HANDLE ALL THE ASSYNC FUNCTION ERRORS INSTEAD OF USING (TRY.CATCH)
////anything you pass inside next() will be detected by global error

module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => next(err));
  };
};
