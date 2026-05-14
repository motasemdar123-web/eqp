function health(req, res) {
  res.json({
    message: 'EQP Backend Running',
    auth: 'microsoft',
  });
}

module.exports = { health };
