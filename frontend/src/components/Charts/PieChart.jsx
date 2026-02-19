import Chart from 'react-apexcharts';
import { Card, CardContent, Typography, Box, Skeleton } from '@mui/material';

const PieChart = ({ data, loading, title = 'Region Revenue Distribution' }) => {
    if (loading) {
        return (
            <Card>
                <CardContent>
                    <Skeleton variant="text" width={200} height={30} />
                    <Skeleton variant="circular" width={300} height={300} sx={{ mx: 'auto', mt: 2 }} />
                </CardContent>
            </Card>
        );
    }

    const chartData = {
        series: data?.map((item) => parseFloat(item.total_revenue) || 0) || [],
        options: {
            chart: {
                type: 'pie',
            },
            labels: data?.map((item) => item.region) || [],
            colors: ['#1976d2', '#9c27b0', '#2e7d32', '#ed6c02', '#d32f2f'],
            legend: {
                position: 'bottom',
            },
            tooltip: {
                y: {
                    formatter: (value) => `$${value.toLocaleString()}`,
                },
            },
            dataLabels: {
                enabled: true,
                formatter: (val) => `${val.toFixed(1)}%`,
            },
        },
    };

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    {title}
                </Typography>
                {data && data.length > 0 ? (
                    <Chart options={chartData.options} series={chartData.series} type="pie" height={300} />
                ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                            No data available
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default PieChart;
