import Chart from 'react-apexcharts';
import { Card, CardContent, Typography, Box, Skeleton } from '@mui/material';

const LineChart = ({ data, loading, title = 'Revenue Trends' }) => {
    if (loading) {
        return (
            <Card>
                <CardContent>
                    <Skeleton variant="text" width={200} height={30} />
                    <Skeleton variant="rectangular" height={300} sx={{ mt: 2 }} />
                </CardContent>
            </Card>
        );
    }

    const chartData = {
        series: [
            {
                name: 'Revenue',
                data: data?.map((item) => parseFloat(item.revenue) || 0) || [],
            },
        ],
        options: {
            chart: {
                type: 'line',
                toolbar: {
                    show: true,
                },
                zoom: {
                    enabled: true,
                },
            },
            stroke: {
                curve: 'smooth',
                width: 3,
            },
            colors: ['#1976d2'],
            xaxis: {
                categories: data?.map((item) => item.period) || [],
                labels: {
                    rotate: -45,
                },
            },
            yaxis: {
                labels: {
                    formatter: (value) => `$${value.toLocaleString()}`,
                },
            },
            tooltip: {
                y: {
                    formatter: (value) => `$${value.toLocaleString()}`,
                },
            },
            dataLabels: {
                enabled: false,
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
                    <Chart options={chartData.options} series={chartData.series} type="line" height={300} />
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

export default LineChart;
