function health(req, res) {
  res.json({
    message: 'EQP Backend Running',
  });
}

module.exports = { health };
