const express = require('express');
const axios = require('axios');
const app = express();

const WINDOW_SIZE = 10;
const TIMEOUT_LIMIT = 500;
const THIRD_PARTY_SERVER = 'http://20.244.56.144/test';

let numbers = [];
let windowPrevState = [];

const fetchNumbersFromThirdParty = async (numberType) => {
  try {
    switch (numberType)
    {
        case 'p':
            numberType='primes';
            break;
        
        case 'f':
            numberType='fibo';
            break;
        
        case 'e':
            numberType='even';
            break;
        
        case 'r':
            numberType='random';
            break;
        
        default:
        return res.status(400).send('Invalid numberid');
    }
      
    const response = await axios.get(`${THIRD_PARTY_SERVER}/${numberType}`, {
      timeout: TIMEOUT_LIMIT,
    });
    const newNumbers = response.data.numbers;
    return newNumbers;
  } catch (error) {
    console.error(`Error fetching ${numberType} numbers:`, error.message);
    return [];
  }
};

const calculateAverage = (nums) => nums.reduce((sum, num) => sum + num, 0) / nums.length;

app.get('/numbers/:numberType', async (req, res) => {
  const { numberType } = req.params;
  const validTypes = ['p', 'f', 'e', 'r'];

  if (!validTypes.includes(numberType)) {
    return res.status(400).json({ error: 'Invalid number type' });
  }

    try {
        const newNumbers = await fetchNumbersFromThirdParty(numberType);
        const uniqueNewNumbers = [...new Set([...numbers, ...newNumbers])];

        windowPrevState = [...numbers];
        numbers = uniqueNewNumbers.slice(-WINDOW_SIZE);

        const avg = calculateAverage(numbers);

        res.json({
            windowPrevState,
            windowCurrState: numbers,
            numbers: newNumbers,
            avg,
        });
    }catch (error) {
        if (error.code === 'ECONNABORTED') {
            console.error('Request took longer than 500ms');
            res.status(408).send('Request Timeout');
        }
        else if (error.response && error.response.status === 404) {
            console.error('API endpoint not found');
            res.status(404).send('Not Found');
        }
        else {
            console.error("hi    "+error);
            res.status(500).send('Internal Server Error');
        }
    }
});

const PORT = 9876;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Server running at http://localhost:${PORT}`);
});
  
