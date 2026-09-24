const parsePositiveInteger = (value) => {
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

module.exports = { parsePositiveInteger };
