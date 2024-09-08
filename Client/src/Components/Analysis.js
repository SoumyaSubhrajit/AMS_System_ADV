import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Grid, Card, CardContent, Typography, CircularProgress, Box, Container } from '@mui/material';
import { Pie } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import 'chart.js/auto';
import Navbar from './Navbar';

const Analysis = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/v1/asset/summary');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <CircularProgress />;
  }

  const createPieData = (label, value, color) => ({
    labels: [label],
    datasets: [
      {
        data: [value],
        backgroundColor: [color],
        borderColor: [color],
        borderWidth: 1,
      },
    ],
  });

  const pieOptions = {
    responsive: true,
    plugins: {
      datalabels: {
        formatter: (value) => value,
        color: '#fff',
        font: {
          weight: 'bold',
          size: 16,
        },
      },
    },
  };

  const cardStyles = {
    backgroundColor: '#fff',
    color: '#000',
    textAlign: 'center',
  };

  const boxStyles = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '150px', // Reduce the card height a bit
  };

  const containerStyles = {
    paddingTop: '20px', // Adjust the padding top as needed
  };

  return (
    <>
      
      <Container style={containerStyles}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Card style={cardStyles}>
              <CardContent>
                <Typography variant="h5" component="div" gutterBottom>
                  Total Assets
                </Typography>
                <Typography variant="h6">
                  {data.totalAssets}
                </Typography>
                <Box sx={boxStyles}>
                  <Pie data={createPieData('Total Assets', data.totalAssets, 'rgba(75, 192, 192, 0.8)')} options={pieOptions} plugins={[ChartDataLabels]} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card style={cardStyles}>
              <CardContent>
                <Typography variant="h5" component="div" gutterBottom>
                  Active Assets
                </Typography>
                <Typography variant="h6">
                  {data.activeAssets}
                </Typography>
                <Box sx={boxStyles}>
                  <Pie data={createPieData('Active Assets', data.activeAssets, 'rgba(153, 102, 255, 0.8)')} options={pieOptions} plugins={[ChartDataLabels]} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card style={cardStyles}>
              <CardContent>
                <Typography variant="h5" component="div" gutterBottom>
                  Total Employees
                </Typography>
                <Typography variant="h6">
                  {data.totalEmployees}
                </Typography>
                <Box sx={boxStyles}>
                  <Pie data={createPieData('Total Employees', data.totalEmployees, 'rgba(255, 159, 64, 0.8)')} options={pieOptions} plugins={[ChartDataLabels]} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default Analysis;
