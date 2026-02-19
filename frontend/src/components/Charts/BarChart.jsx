import Chart from 'react-apexcharts';
import { Card, CardContent, Typography, Box, Skeleton } from '@mui/material';

const BarChart = ({ data, loading, title = 'Product Sales' }) => {
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
                data: data?.map((item) => parseFloat(item.total_revenue) || 0) || [],
            },
        ],
        options: {
            chart: {
                type: 'bar',
                toolbar: {
                    show: true,
                },
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    borderRadius: 8,
                    dataLabels: {
                        position: 'top',
                    },
                },
            },
            colors: ['#9c27b0'],
            xaxis: {
                categories: data?.map((item) => item.product_name) || [],
                labels: {
                    rotate: -45,
                    trim: true,
                    maxHeight: 80,
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
                    <Chart options={chartData.options} series={chartData.series} type="bar" height={300} />
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

export default BarChart;
