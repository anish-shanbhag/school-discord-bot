const abbreviations = {
  "IB Math: Calculus": "math",
  "IB English A: Lang & Lit 1": "english",
  "IB Biology 1": "bio",
  "IB History of the Americas": "hoa",
  "IB Spanish B1": "spanish",
  "IB Philosophy": "philosophy",
  "IB Chinese B1": "chinese",
  "AP Psychology": "psychology",
  "Wind Ensemble H": "band"
}

const fullNames = Object.entries(abbreviations).reduce((fullNames, abbreviation) => ({
  ...fullNames,
  [abbreviation[1]] : abbreviation[0]
}), {});

module.exports = {
  abbreviations,
  fullNames
}