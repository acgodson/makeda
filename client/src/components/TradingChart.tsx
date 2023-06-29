import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { Box } from "@chakra-ui/react";

const TradingChart = () => {
  const chartRef = useRef<any | null>(null);
  const [chartDataETH, setChartDataETH] = useState<any[] | null>(null);
  const [chartDataBTC, setChartDataBTC] = useState<any[] | null>(null);


  useEffect(() => {
    const fetchChartData = async () => {
      try {
        // Fetch historical price data for ETH to USDC from the API
        const responseETH = await fetch(
          "https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=30"
        );
        const responseBTC = await fetch(
          "https://api.coingecko.com/api/v3/coins/tether/market_chart?vs_currency=usd&days=30"
        );
        const dataETH = await responseETH.json();
        const dataBTC = await responseBTC.json();
        // console.log(dataBTC)

        // Extract the necessary data for the chart
        const pricesETH = dataETH.prices;
        const pricesBTC = dataBTC.prices;
        const uniqueDates = new Set();
        const formattedDataETH = pricesETH.reduce(
          (result: any[], price: [number, number]) => {
            const date = formatDate(new Date(price[0]));
            if (!uniqueDates.has(date)) {
              uniqueDates.add(date);
              result.push({ time: date, value: price[1] });
            }
            return result;
          },
          []
        );

        const formattedDataBTC = pricesBTC.reduce(
          (result: any[], price: [number, number]) => {
            const date = formatDate(new Date(price[0]));
            if (!uniqueDates.has(date)) {
              uniqueDates.add(date);
              result.push({ time: date, value: price[1] });
            }
            return result;
          },
          []
        );

        setChartDataETH(formattedDataETH);
        setChartDataBTC(formattedDataBTC);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (!chartDataBTC || !chartDataBTC) {
      fetchChartData();
    }

  });

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (!chartDataETH || !chartDataBTC) return;

    const chart = createChart(chartRef.current, {
      width: 800,
      height: 300,
      watermark: { text: "ETH/BTC", visible: false },
      layout: { textColor: 'white', background: { color: 'transparent' } },
      grid: {
        vertLines: {
          color: "transparent"
        },
        horzLines: {
          color: "transparent"
        }
      }
    });

    const lineSeriesETH = chart.addLineSeries();
    lineSeriesETH.setData(chartDataETH!);

    lineSeriesETH.applyOptions({
      lineWidth: 2,
      crosshairMarkerVisible: false,
      priceFormat: {
        type: "custom",
        formatter: (price: number) => price.toFixed(2),
      },
      priceLineVisible: true,
      baseLineVisible: false,
    });

    const lineSeriesBTC = chart.addLineSeries();
    lineSeriesBTC.setData(chartDataBTC);

    lineSeriesBTC.applyOptions({
      lineWidth: 2,
      crosshairMarkerVisible: false,
      priceFormat: {
        type: "custom",
        formatter: (price: number) => price.toFixed(2),
      },
      priceLineVisible: true,
      baseLineVisible: false,
    });

    const areaSeriesETH = chart.addAreaSeries();
    areaSeriesETH.setData(chartDataETH);
    areaSeriesETH.applyOptions({
      topColor: "rgba(79, 129, 255, 0.2)",
      bottomColor: "rgba(79, 129, 255, 0)",
      lineColor: "rgba(0, 0, 0, 0)",
    });

    const areaSeriesBTC = chart.addAreaSeries();
    areaSeriesBTC.setData(chartDataBTC);
    areaSeriesBTC.applyOptions({
      topColor: "rgba(255, 79, 129, 0.2)",
      bottomColor: "rgba(255, 79, 129, 0)",
      lineColor: "rgba(0, 0, 0, 0)",
    });

    chart.timeScale().fitContent();
    // Find intersection point
    const intersectionPoint = findIntersectionPoint(chartDataETH, chartDataBTC);
    console.log("Intersection Point:", intersectionPoint);

    return () => {
      chart.remove();
    };
  }, [chartDataETH, chartDataBTC]);

  useEffect(() => {

    if (chartDataBTC && chartDataBTC.length > 1) {
      console.log(chartDataBTC)
    }
  }, [chartDataBTC])


  const findIntersectionPoint = (data1: any[], data2: any[]) => {
    if (!chartDataBTC || !chartDataETH) return;
    const intersection = data1.find((point1: any) => {
      return data2.find((point2: any) => point2.time === point1.time);
    });
    return intersection;
  };

  return <Box
    bg="transparent"
    w="100%" ref={chartRef} />;
};

export default TradingChart;
