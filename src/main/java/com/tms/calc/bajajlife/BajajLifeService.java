package com.tms.calc.bajajlife;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class BajajLifeService {
    
    private static final double GST_MULTIPLIER = 1.18;
    
    // Rate table: Premium per 1000 of Sum Assured (excluding GST)
    // Map<Age, Map<TermMonths, Rate>>
    private static final Map<Integer, Map<Integer, Double>> RATE_TABLE = initializeRateTable();
    
    // NML Grid: Medical underwriting requirements
    // Map<AgeBand, Map<SumAssuredRange, MedicalRequirement>>
    private static final Map<String, Map<String, String>> NML_GRID = initializeNMLGrid();
    
    private static Map<Integer, Map<Integer, Double>> initializeRateTable() {
        Map<Integer, Map<Integer, Double>> table = new HashMap<>();
        
        // Age 18
        table.put(18, Map.ofEntries(
            Map.entry(1, 1.8569),
                Map.entry(2, 3.3777),
                Map.entry(3, 4.9300),
                Map.entry(4, 6.5025),
                Map.entry(5, 8.0846),
                Map.entry(6, 9.6674),
                Map.entry(7, 11.2436),
                Map.entry(8, 12.8079),
                Map.entry(9, 14.3562),
                Map.entry(10, 15.8862),
                Map.entry(11, 17.3962),
                Map.entry(12, 18.8863),
                Map.entry(13, 20.3571),
                Map.entry(14, 21.8101),
                Map.entry(15, 23.2475)
        ));
        
        // Age 19
        table.put(19, Map.ofEntries(
            Map.entry(1, 1.9108),
                Map.entry(2, 3.471),
                Map.entry(3, 5.0516),
                Map.entry(4, 6.6431),
                Map.entry(5, 8.2369),
                Map.entry(6, 9.8261),
                Map.entry(7, 11.4057),
                Map.entry(8, 12.9718),
                Map.entry(9, 14.5222),
                Map.entry(10, 16.0556),
                Map.entry(11, 17.5718),
                Map.entry(12, 19.0717),
                Map.entry(13, 20.5569),
                Map.entry(14, 22.0295),
                Map.entry(15, 23.4921)
        ));
        
        // Age 20
        table.put(20, Map.ofEntries(
            Map.entry(1, 1.9438),
                Map.entry(2, 3.5267),
                Map.entry(3, 5.1216),
                Map.entry(4, 6.7207),
                Map.entry(5, 8.3176),
                Map.entry(6, 9.9074),
                Map.entry(7, 11.4869),
                Map.entry(8, 13.0537),
                Map.entry(9, 14.6066),
                Map.entry(10, 16.1459),
                Map.entry(11, 17.6721),
                Map.entry(12, 19.187),
                Map.entry(13, 20.6928),
                Map.entry(14, 22.192),
                Map.entry(15, 23.6874)
        ));
        
        // Age 21
        table.put(21, Map.ofEntries(
            Map.entry(1, 1.9611),
                Map.entry(2, 3.5541),
                Map.entry(3, 5.1531),
                Map.entry(4, 6.7525),
                Map.entry(5, 8.3479),
                Map.entry(6, 9.9363),
                Map.entry(7, 11.5155),
                Map.entry(8, 13.0845),
                Map.entry(9, 14.6434),
                Map.entry(10, 16.1932),
                Map.entry(11, 17.7354),
                Map.entry(12, 19.2723),
                Map.entry(13, 20.8065),
                Map.entry(14, 22.3407),
                Map.entry(15, 23.8779)
        ));
        
        // Age 22
        table.put(22, Map.ofEntries(
            Map.entry(1, 1.9663),
                Map.entry(2, 3.5606),
                Map.entry(3, 5.1578),
                Map.entry(4, 6.7543),
                Map.entry(5, 8.3473),
                Map.entry(6, 9.9351),
                Map.entry(7, 11.5166),
                Map.entry(8, 13.0921),
                Map.entry(9, 14.6625),
                Map.entry(10, 16.2296),
                Map.entry(11, 17.7957),
                Map.entry(12, 19.3631),
                Map.entry(13, 20.9348),
                Map.entry(14, 22.5136),
                Map.entry(15, 24.1025)
        ));
        
        // Age 23
        table.put(23, Map.ofEntries(
            Map.entry(1, 1.9646),
                Map.entry(2, 3.5555),
                Map.entry(3, 5.1489),
                Map.entry(4, 6.7427),
                Map.entry(5, 8.3354),
                Map.entry(6, 9.926),
                Map.entry(7, 11.515),
                Map.entry(8, 13.1034),
                Map.entry(9, 14.6929),
                Map.entry(10, 16.286),
                Map.entry(11, 17.8851),
                Map.entry(12, 19.4928),
                Map.entry(13, 21.1122),
                Map.entry(14, 22.7462),
                Map.entry(15, 24.3984)
        ));
        
        // Age 24
        table.put(24, Map.ofEntries(
            Map.entry(1, 1.9594),
                Map.entry(2, 3.5463),
                Map.entry(3, 5.1374),
                Map.entry(4, 6.7315),
                Map.entry(5, 8.3281),
                Map.entry(6, 9.9276),
                Map.entry(7, 11.5313),
                Map.entry(8, 13.141),
                Map.entry(9, 14.759),
                Map.entry(10, 16.3879),
                Map.entry(11, 18.0303),
                Map.entry(12, 19.6892),
                Map.entry(13, 21.3675),
                Map.entry(14, 23.0684),
                Map.entry(15, 24.7955)
        ));
        
        // Age 25
        table.put(25, Map.ofEntries(
            Map.entry(1, 1.9559),
                Map.entry(2, 3.5414),
                Map.entry(3, 5.1338),
                Map.entry(4, 6.7332),
                Map.entry(5, 8.3405),
                Map.entry(6, 9.9569),
                Map.entry(7, 11.5844),
                Map.entry(8, 13.2253),
                Map.entry(9, 14.8821),
                Map.entry(10, 16.5578),
                Map.entry(11, 18.2551),
                Map.entry(12, 19.9769),
                Map.entry(13, 21.7264),
                Map.entry(14, 23.5067),
                Map.entry(15, 25.3217)
        ));
        
        // Age 26
        table.put(26, Map.ofEntries(
            Map.entry(1, 1.9559),
                Map.entry(2, 3.544),
                Map.entry(3, 5.1435),
                Map.entry(4, 6.7558),
                Map.entry(5, 8.3824),
                Map.entry(6, 10.0254),
                Map.entry(7, 11.6872),
                Map.entry(8, 13.3703),
                Map.entry(9, 15.0776),
                Map.entry(10, 16.8121),
                Map.entry(11, 18.5765),
                Map.entry(12, 20.374),
                Map.entry(13, 22.2078),
                Map.entry(14, 24.081),
                Map.entry(15, 25.9977)
        ));
        
        // Age 27
        table.put(27, Map.ofEntries(
            Map.entry(1, 1.9611),
                Map.entry(2, 3.5585),
                Map.entry(3, 5.1733),
                Map.entry(4, 6.8078),
                Map.entry(5, 8.4641),
                Map.entry(6, 10.1447),
                Map.entry(7, 11.8524),
                Map.entry(8, 13.5899),
                Map.entry(9, 15.36),
                Map.entry(10, 17.1661),
                Map.entry(11, 19.0109),
                Map.entry(12, 20.8977),
                Map.entry(13, 22.8298),
                Map.entry(14, 24.8108),
                Map.entry(15, 26.8436)
        ));
        
        // Age 28
        table.put(28, Map.ofEntries(
            Map.entry(1, 1.975),
                Map.entry(2, 3.5905),
                Map.entry(3, 5.2307),
                Map.entry(4, 6.8982),
                Map.entry(5, 8.5958),
                Map.entry(6, 10.3261),
                Map.entry(7, 12.0923),
                Map.entry(8, 13.897),
                Map.entry(9, 15.7432),
                Map.entry(10, 17.6346),
                Map.entry(11, 19.5739),
                Map.entry(12, 21.5647),
                Map.entry(13, 23.61),
                Map.entry(14, 25.7139),
                Map.entry(15, 27.8794)
        ));
        
        // Age 29
        table.put(29, Map.ofEntries(
            Map.entry(1, 1.9993),
                Map.entry(2, 3.6436),
                Map.entry(3, 5.3203),
                Map.entry(4, 7.0328),
                Map.entry(5, 8.7842),
                Map.entry(6, 10.5771),
                Map.entry(7, 12.4149),
                Map.entry(8, 14.3004),
                Map.entry(9, 16.2371),
                Map.entry(10, 18.2282),
                Map.entry(11, 20.2772),
                Map.entry(12, 22.3872),
                Map.entry(13, 24.5622),
                Map.entry(14, 26.8055),
                Map.entry(15, 29.1218)
        ));
        
        // Age 30
        table.put(30, Map.ofEntries(
            Map.entry(1, 2.0358),
                Map.entry(2, 3.7201),
                Map.entry(3, 5.4457),
                Map.entry(4, 7.2161),
                Map.entry(5, 9.0343),
                Map.entry(6, 10.9035),
                Map.entry(7, 12.8268),
                Map.entry(8, 14.8077),
                Map.entry(9, 16.8498),
                Map.entry(10, 18.9564),
                Map.entry(11, 21.1309),
                Map.entry(12, 23.3768),
                Map.entry(13, 25.6987),
                Map.entry(14, 28.1006),
                Map.entry(15, 30.5882)
        ));
        
        // Age 31
        table.put(31, Map.ofEntries(
            Map.entry(1, 2.0844),
                Map.entry(2, 3.8218),
                Map.entry(3, 5.6094),
                Map.entry(4, 7.4509),
                Map.entry(5, 9.3498),
                Map.entry(6, 11.3094),
                Map.entry(7, 13.3334),
                Map.entry(8, 15.425),
                Map.entry(9, 17.5886),
                Map.entry(10, 19.8271),
                Map.entry(11, 22.1444),
                Map.entry(12, 24.5448),
                Map.entry(13, 27.033),
                Map.entry(14, 29.6148),
                Map.entry(15, 32.2973)
        ));
        
        // Age 32
        table.put(32, Map.ofEntries(
            Map.entry(1, 2.1487),
                Map.entry(2, 3.9519),
                Map.entry(3, 5.815),
                Map.entry(4, 7.7417),
                Map.entry(5, 9.7359),
                Map.entry(6, 11.8013),
                Map.entry(7, 13.9416),
                Map.entry(8, 16.1608),
                Map.entry(9, 18.4626),
                Map.entry(10, 20.8508),
                Map.entry(11, 23.3296),
                Map.entry(12, 25.9048),
                Map.entry(13, 28.5818),
                Map.entry(14, 31.3682),
                Map.entry(15, 34.2733)
        ));
        
        // Age 33
        table.put(33, Map.ofEntries(
            Map.entry(1, 2.2251),
                Map.entry(2, 4.1081),
                Map.entry(3, 6.0609),
                Map.entry(4, 8.0878),
                Map.entry(5, 10.1928),
                Map.entry(6, 12.3803),
                Map.entry(7, 14.654),
                Map.entry(8, 17.0182),
                Map.entry(9, 19.4766),
                Map.entry(10, 22.034),
                Map.entry(11, 24.6961),
                Map.entry(12, 27.469),
                Map.entry(13, 30.3608),
                Map.entry(14, 33.381),
                Map.entry(15, 36.5407)
        ));
        
        // Age 34
        table.put(34, Map.ofEntries(
            Map.entry(1, 2.3189),
                Map.entry(2, 4.296),
                Map.entry(3, 6.3537),
                Map.entry(4, 8.4967),
                Map.entry(5, 10.7293),
                Map.entry(6, 13.0563),
                Map.entry(7, 15.4814),
                Map.entry(8, 18.0095),
                Map.entry(9, 20.6449),
                Map.entry(10, 23.3937),
                Map.entry(11, 26.2632),
                Map.entry(12, 29.2613),
                Map.entry(13, 32.3983),
                Map.entry(14, 35.686),
                Map.entry(15, 39.1385)
        ));
        
        // Age 35
        table.put(35, Map.ofEntries(
            Map.entry(1, 2.4265),
                Map.entry(2, 4.5133),
                Map.entry(3, 6.6923),
                Map.entry(4, 8.9686),
                Map.entry(5, 11.347),
                Map.entry(6, 13.8319),
                Map.entry(7, 16.428),
                Map.entry(8, 19.1408),
                Map.entry(9, 21.9763),
                Map.entry(10, 24.9423),
                Map.entry(11, 28.0474),
                Map.entry(12, 31.3027),
                Map.entry(13, 34.7206),
                Map.entry(14, 38.3159),
                Map.entry(15, 42.1028)
        ));
        
        // Age 36
        table.put(36, Map.ofEntries(
            Map.entry(1, 2.5533),
                Map.entry(2, 4.7666),
                Map.entry(3, 7.0844),
                Map.entry(4, 9.5124),
                Map.entry(5, 12.0553),
                Map.entry(6, 14.7182),
                Map.entry(7, 17.5072),
                Map.entry(8, 20.4289),
                Map.entry(9, 23.491),
                Map.entry(10, 26.704),
                Map.entry(11, 30.0787),
                Map.entry(12, 33.6288),
                Map.entry(13, 37.3691),
                Map.entry(14, 41.3166),
                Map.entry(15, 45.4852)
        ));
        
        // Age 37
        table.put(37, Map.ofEntries(
            Map.entry(1, 2.6975),
                Map.entry(2, 5.0551),
                Map.entry(3, 7.5305),
                Map.entry(4, 10.1296),
                Map.entry(5, 12.8578),
                Map.entry(6, 15.7213),
                Map.entry(7, 18.7284),
                Map.entry(8, 21.8867),
                Map.entry(9, 25.2073),
                Map.entry(10, 28.7024),
                Map.entry(11, 32.3864),
                Map.entry(12, 36.2751),
                Map.entry(13, 40.3861),
                Map.entry(14, 44.7345),
                Map.entry(15, 49.3353)
        ));
        
        // Age 38
        table.put(38, Map.ofEntries(
            Map.entry(1, 2.8625),
                Map.entry(2, 5.3837),
                Map.entry(3, 8.0368),
                Map.entry(4, 10.8281),
                Map.entry(5, 13.765),
                Map.entry(6, 16.8558),
                Map.entry(7, 20.1096),
                Map.entry(8, 23.5376),
                Map.entry(9, 27.1541),
                Map.entry(10, 30.9735),
                Map.entry(11, 35.0131),
                Map.entry(12, 39.2911),
                Map.entry(13, 43.824),
                Map.entry(14, 48.6271),
                Map.entry(15, 53.7116)
        ));
        
        // Age 39
        table.put(39, Map.ofEntries(
            Map.entry(1, 3.0484),
                Map.entry(2, 5.7534),
                Map.entry(3, 8.6058),
                Map.entry(4, 11.614),
                Map.entry(5, 14.7871),
                Map.entry(6, 18.1355),
                Map.entry(7, 21.6713),
                Map.entry(8, 25.4091),
                Map.entry(9, 29.3654),
                Map.entry(10, 33.5581),
                Map.entry(11, 38.0066),
                Map.entry(12, 42.7283),
                Map.entry(13, 47.7396),
                Map.entry(14, 53.0518),
                Map.entry(15, 58.671)
        ));
        
        // Age 40
        table.put(40, Map.ofEntries(
            Map.entry(1, 3.2569),
                Map.entry(2, 6.1683),
                Map.entry(3, 9.2459),
                Map.entry(4, 12.5),
                Map.entry(5, 15.9418),
                Map.entry(6, 19.5847),
                Map.entry(7, 23.4442),
                Map.entry(8, 27.5388),
                Map.entry(9, 31.887),
                Map.entry(10, 36.5088),
                Map.entry(11, 41.4243),
                Map.entry(12, 46.6493),
                Map.entry(13, 52.1962),
                Map.entry(14, 58.0709),
                Map.entry(15, 64.2741)
        ));
        
        // Age 41
        table.put(41, Map.ofEntries(
            Map.entry(1, 3.4915),
                Map.entry(2, 6.6369),
                Map.entry(3, 9.9703),
                Map.entry(4, 13.5045),
                Map.entry(5, 17.254),
                Map.entry(6, 21.236),
                Map.entry(7, 25.4697),
                Map.entry(8, 29.9755),
                Map.entry(9, 34.7747),
                Map.entry(10, 39.8879),
                Map.entry(11, 45.3322),
                Map.entry(12, 51.1205),
                Map.entry(13, 57.259),
                Map.entry(14, 63.7476),
                Map.entry(15, 70.5751)
        ));
        
        // Age 42
        table.put(42, Map.ofEntries(
            Map.entry(1, 3.7591),
                Map.entry(2, 7.1707),
                Map.entry(3, 10.7959),
                Map.entry(4, 14.6518),
                Map.entry(5, 18.7565),
                Map.entry(6, 23.1304),
                Map.entry(7, 27.7963),
                Map.entry(8, 32.776),
                Map.entry(9, 38.0915),
                Map.entry(10, 43.7608),
                Map.entry(11, 49.7975),
                Map.entry(12, 56.2077),
                Map.entry(13, 62.991),
                Map.entry(14, 70.1357),
                Map.entry(15, 77.6231)
        ));
        
        // Age 43
        table.put(43, Map.ofEntries(
            Map.entry(1, 4.0633),
                Map.entry(2, 7.7792),
                Map.entry(3, 11.7408),
                Map.entry(4, 15.9685),
                Map.entry(5, 20.4845),
                Map.entry(6, 25.3124),
                Map.entry(7, 30.4762),
                Map.entry(8, 35.9982),
                Map.entry(9, 41.8987),
                Map.entry(10, 48.1906),
                Map.entry(11, 54.8807),
                Map.entry(12, 61.9679),
                Map.entry(13, 69.4401),
                Map.entry(14, 77.2773),
                Map.entry(15, 85.4512)
        ));
        
        // Age 44
        table.put(44, Map.ofEntries(
            Map.entry(1, 4.4127),
                Map.entry(2, 8.4806),
                Map.entry(3, 12.8323),
                Map.entry(4, 17.4918),
                Map.entry(5, 22.4844),
                Map.entry(6, 27.8359),
                Map.entry(7, 33.5698),
                Map.entry(8, 39.7067),
                Map.entry(9, 46.2609),
                Map.entry(10, 53.2389),
                Map.entry(11, 60.6392),
                Map.entry(12, 68.4491),
                Map.entry(13, 76.6473),
                Map.entry(14, 85.204),
                Map.entry(15, 94.0823)
        ));
        
        // Age 45
        table.put(45, Map.ofEntries(
            Map.entry(1, 4.8195),
                Map.entry(2, 9.2966),
                Map.entry(3, 14.1016),
                Map.entry(4, 19.262),
                Map.entry(5, 24.8049),
                Map.entry(6, 30.7554),
                Map.entry(7, 37.1343),
                Map.entry(8, 43.9581),
                Map.entry(9, 51.2321),
                Map.entry(10, 58.9536),
                Map.entry(11, 67.112),
                Map.entry(12, 75.6822),
                Map.entry(13, 84.6336),
                Map.entry(14, 93.9277),
                Map.entry(15, 103.5244)
        ));
        
        // Age 46
        table.put(46, Map.ofEntries(
            Map.entry(1, 5.2925),
                Map.entry(2, 10.2456),
                Map.entry(3, 15.5768),
                Map.entry(4, 21.3154),
                Map.entry(5, 27.4874),
                Map.entry(6, 34.1152),
                Map.entry(7, 41.2147),
                Map.entry(8, 48.7924),
                Map.entry(9, 56.8451),
                Map.entry(10, 65.3605),
                Map.entry(11, 74.3133),
                Map.entry(12, 83.671),
                Map.entry(13, 93.3933),
                Map.entry(14, 103.4383),
                Map.entry(15, 113.7554)
        ));
        
        // Age 47
        table.put(47, Map.ofEntries(
            Map.entry(1, 5.8439),
                Map.entry(2, 11.3501),
                Map.entry(3, 17.2884),
                Map.entry(4, 23.6867),
                Map.entry(5, 30.5693),
                Map.entry(6, 37.9516),
                Map.entry(7, 45.8405),
                Map.entry(8, 54.2327),
                Map.entry(9, 63.1144),
                Map.entry(10, 72.4598),
                Map.entry(11, 82.2348),
                Map.entry(12, 92.3973),
                Map.entry(13, 102.9033),
                Map.entry(14, 113.701),
                Map.entry(15, 124.7424)
        ));
        
        // Age 48
        table.put(48, Map.ofEntries(
            Map.entry(1, 6.4842),
                Map.entry(2, 12.6271),
                Map.entry(3, 19.2574),
                Map.entry(4, 26.4),
                Map.entry(5, 34.0712),
                Map.entry(6, 42.2787),
                Map.entry(7, 51.018),
                Map.entry(8, 60.2746),
                Map.entry(9, 70.022),
                Map.entry(10, 80.2245),
                Map.entry(11, 90.8384),
                Map.entry(12, 101.8178),
                Map.entry(13, 113.1094),
                Map.entry(14, 124.6636),
                Map.entry(15, 136.4314)
        ));
        
        // Age 49
        table.put(49, Map.ofEntries(
            Map.entry(1, 7.2186),
                Map.entry(2, 14.0858),
                Map.entry(3, 21.4939),
                Map.entry(4, 29.4605),
                Map.entry(5, 37.9925),
                Map.entry(6, 47.0861),
                Map.entry(7, 56.7249),
                Map.entry(8, 66.8831),
                Map.entry(9, 77.5223),
                Map.entry(10, 88.5981),
                Map.entry(11, 100.0621),
                Map.entry(12, 111.8605),
                Map.entry(13, 123.9416),
                Map.entry(14, 136.2552),
                Map.entry(15, 148.754)
        ));
        
        // Age 50
        table.put(50, Map.ofEntries(
            Map.entry(1, 8.0509),
                Map.entry(2, 15.7297),
                Map.entry(3, 23.9964),
                Map.entry(4, 32.8589),
                Map.entry(5, 42.3126),
                Map.entry(6, 52.341),
                Map.entry(7, 62.9165),
                Map.entry(8, 74.0006),
                Map.entry(9, 85.5473),
                Map.entry(10, 97.5065),
                Map.entry(11, 109.8235),
                Map.entry(12, 122.4452),
                Map.entry(13, 135.32),
                Map.entry(14, 148.3992),
                Map.entry(15, 161.6431)
        ));
        
        // Age 51
        table.put(51, Map.ofEntries(
            Map.entry(1, 8.9792),
                Map.entry(2, 17.5505),
                Map.entry(3, 26.7473),
                Map.entry(4, 36.5652),
                Map.entry(5, 46.9885),
                Map.entry(6, 57.9867),
                Map.entry(7, 69.5231),
                Map.entry(8, 81.5486),
                Map.entry(9, 94.011),
                Map.entry(10, 106.8588),
                Map.entry(11, 120.0337),
                Map.entry(12, 133.4845),
                Map.entry(13, 147.1615),
                Map.entry(14, 161.0233),
                Map.entry(15, 175.0241)
        ));
        
        // Age 52
        table.put(52, Map.ofEntries(
            Map.entry(1, 9.9916),
                Map.entry(2, 19.5259),
                Map.entry(3, 29.7118),
                Map.entry(4, 40.5327),
                Map.entry(5, 51.9591),
                Map.entry(6, 63.9517),
                Map.entry(7, 76.4625),
                Map.entry(8, 89.4379),
                Map.entry(9, 102.8244),
                Map.entry(10, 116.5645),
                Map.entry(11, 130.6055),
                Map.entry(12, 144.897),
                Map.entry(13, 159.3962),
                Map.entry(14, 174.0572),
                Map.entry(15, 188.8423)
        ));
        
        // Age 53
        table.put(53, Map.ofEntries(
            Map.entry(1, 11.0795),
                Map.entry(2, 21.6346),
                Map.entry(3, 32.8549),
                Map.entry(4, 44.7113),
                Map.entry(5, 57.1633),
                Map.entry(6, 70.1644),
                Map.entry(7, 83.6591),
                Map.entry(8, 97.5928),
                Map.entry(9, 111.9088),
                Map.entry(10, 126.5536),
                Map.entry(11, 141.4761),
                Map.entry(12, 156.6321),
                Map.entry(13, 171.9758),
                Map.entry(14, 187.4684),
                Map.entry(15, 203.0717)
        ));
        
        // Age 54
        table.put(54, Map.ofEntries(
            Map.entry(1, 12.2255),
                Map.entry(2, 23.8447),
                Map.entry(3, 36.131),
                Map.entry(4, 49.0449),
                Map.entry(5, 62.538),
                Map.entry(6, 76.5565),
                Map.entry(7, 91.0438),
                Map.entry(8, 105.9462),
                Map.entry(9, 121.2073),
                Map.entry(10, 136.7766),
                Map.entry(11, 152.6089),
                Map.entry(12, 168.6585),
                Map.entry(13, 184.8853),
                Map.entry(14, 201.2499),
                Map.entry(15, 217.7129)
        ));
        
        // Age 55
        table.put(55, Map.ofEntries(
            Map.entry(1, 13.4157),
                Map.entry(2, 26.1301),
                Map.entry(3, 39.504),
                Map.entry(4, 53.49),
                Map.entry(5, 68.0352),
                Map.entry(6, 83.083),
                Map.entry(7, 98.5786),
                Map.entry(8, 114.4676),
                Map.entry(9, 130.6991),
                Map.entry(10, 147.225),
                Map.entry(11, 164.0054),
                Map.entry(12, 180.9939),
                Map.entry(13, 198.1515),
                Map.entry(14, 215.4372),
                Map.entry(15, 232.8077)
        ));
        
        // Age 56
        table.put(56, Map.ofEntries(
            Map.entry(1, 14.6363),
                Map.entry(2, 28.4677),
                Map.entry(3, 42.9458),
                Map.entry(4, 58.0175),
                Map.entry(5, 73.6298),
                Map.entry(6, 89.7254),
                Map.entry(7, 106.2535),
                Map.entry(8, 123.1617),
                Map.entry(9, 140.4028),
                Map.entry(10, 157.9349),
                Map.entry(11, 175.713),
                Map.entry(12, 193.6962),
                Map.entry(13, 211.842),
                Map.entry(14, 230.1045),
                Map.entry(15, 248.439)
        ));
        
        // Age 57
        table.put(57, Map.ofEntries(
            Map.entry(1, 15.8821),
                Map.entry(2, 30.8493),
                Map.entry(3, 46.4483),
                Map.entry(4, 62.6259),
                Map.entry(5, 79.3285),
                Map.entry(6, 96.5042),
                Map.entry(7, 114.1029),
                Map.entry(8, 132.0776),
                Map.entry(9, 150.3851),
                Map.entry(10, 168.9813),
                Map.entry(11, 187.8238),
                Map.entry(12, 206.8682),
                Map.entry(13, 226.0665),
                Map.entry(14, 245.3698),
                Map.entry(15, 264.7153)
        ));
        
        // Age 58
        table.put(58, Map.ofEntries(
            Map.entry(1, 17.1513),
                Map.entry(2, 33.2749),
                Map.entry(3, 50.0195),
                Map.entry(4, 67.3335),
                Map.entry(5, 85.1658),
                Map.entry(6, 103.4689),
                Map.entry(7, 122.1955),
                Map.entry(8, 141.3013),
                Map.entry(9, 160.7458),
                Map.entry(10, 180.4822),
                Map.entry(11, 200.4654),
                Map.entry(12, 220.645),
                Map.entry(13, 240.9679),
                Map.entry(14, 261.3681),
                Map.entry(15, 281.7761)
        ));
        
        // Age 59
        table.put(59, Map.ofEntries(
            Map.entry(1, 18.4493),
                Map.entry(2, 35.7613),
                Map.entry(3, 53.691),
                Map.entry(4, 72.1896),
                Map.entry(5, 91.209),
                Map.entry(6, 110.7071),
                Map.entry(7, 130.6374),
                Map.entry(8, 150.9584),
                Map.entry(9, 171.6245),
                Map.entry(10, 192.5884),
                Map.entry(11, 213.7969),
                Map.entry(12, 235.1899),
                Map.entry(13, 256.7059),
                Map.entry(14, 278.2616),
                Map.entry(15, 299.7742)
        ));
        
        // Age 60
        table.put(60, Map.ofEntries(
            Map.entry(1, 19.7953),
                Map.entry(2, 38.3454),
                Map.entry(3, 57.5182),
                Map.entry(4, 77.2707),
                Map.entry(5, 97.5579),
                Map.entry(6, 118.3377),
                Map.entry(7, 139.5661),
                Map.entry(8, 161.2004),
                Map.entry(9, 183.1885),
                Map.entry(10, 205.4759),
                Map.entry(11, 227.9987),
                Map.entry(12, 250.6889),
                Map.entry(13, 273.4594),
                Map.entry(14, 296.2195),
                Map.entry(15, 318.8663)
        ));
        
        // Note: The table provided only shows terms 1-15. For terms 16-60, we would need the complete data.
        // For now, I'll add placeholder logic that can be extended when full data is available.
        // In a real scenario, you'd have all 60 terms for each age.
        
        return table;
    }
    
    private static Map<String, Map<String, String>> initializeNMLGrid() {
        Map<String, Map<String, String>> grid = new HashMap<>();
        
        // Age 18-45
        Map<String, String> age18_45 = new HashMap<>();
        age18_45.put("0-2000000", "NM");
        age18_45.put("2000001-5000000", "NM");
        age18_45.put("5000001-7500000", "NM");
        age18_45.put("7500001-10000000", "NM");
        age18_45.put("10000001+", "MER+A1+B1+C+D+CTMT");
        grid.put("18-45", age18_45);
        
        // Age 46-50
        Map<String, String> age46_50 = new HashMap<>();
        age46_50.put("0-2000000", "NM");
        age46_50.put("2000001-5000000", "NM");
        age46_50.put("5000001-7500000", "NM");
        age46_50.put("7500001-10000000", "MER+A1+B1+C+D+CTMT");
        age46_50.put("10000001+", "MER+A1+B1+C+D+CTMT");
        grid.put("46-50", age46_50);
        
        // Age 51-55
        Map<String, String> age51_55 = new HashMap<>();
        age51_55.put("0-2000000", "NM");
        age51_55.put("2000001-5000000", "NM");
        age51_55.put("5000001-7500000", "MER+A1+B1+C+D+CTMT");
        age51_55.put("7500001-10000000", "MER+A1+B1+C+D+CTMT");
        age51_55.put("10000001+", "MER+A1+B1+C+D+CTMT");
        grid.put("51-55", age51_55);
        
        // Age 56-60
        Map<String, String> age56_60 = new HashMap<>();
        age56_60.put("0-2000000", "NM");
        age56_60.put("2000001-5000000", "MER+A1+B1+C+D+CTMT");
        age56_60.put("5000001-7500000", "MER+A1+B1+C+D+CTMT");
        age56_60.put("7500001-10000000", "MER+A1+B1+C+D+CTMT");
        age56_60.put("10000001+", "MER+A1+B1+C+D+CTMT");
        grid.put("56-60", age56_60);
        
        return grid;
    }
    
    public BajajLifeResponse calculate(BajajLifeRequest req) {
        validate(req);
        
        BajajLifeResponse res = new BajajLifeResponse();
        res.sumAssured = req.sumAssured;
        res.coverTermMonths = req.coverTermMonths;
        
        // Get rate from table
        double rate = getRate(req.entryAge, req.coverTermMonths);
        res.ratePerThousand = rate;
        res.ageBand = getAgeBand(req.entryAge);
        
        // Calculate premium: (Sum Assured / 1000) × Rate
        res.premiumExclGst = (req.sumAssured / 1000) * rate;
        res.premiumInclGst = round2(res.premiumExclGst * GST_MULTIPLIER);
        
        // Determine NML status
        res.nmlStatus = getNMLStatus(req.entryAge, req.sumAssured);
        
        return res;
    }
    
    private double getRate(int age, int termMonths) {
        Map<Integer, Double> ageRates = RATE_TABLE.get(age);
        if (ageRates == null) {
            throw new IllegalArgumentException("Invalid age: " + age + ". Age must be between 18-60.");
        }
        
        Double rate = ageRates.get(termMonths);
        if (rate == null) {
            // For terms beyond 15, we need to interpolate or use the highest available term
            // For now, throw an error - in production, you'd have all terms or interpolation logic
            throw new IllegalArgumentException("Rate not available for term " + termMonths + " months at age " + age + ". Available terms: 1-15 months.");
        }
        
        return rate;
    }
    
    private String getAgeBand(int age) {
        if (age >= 18 && age <= 45) return "18-45";
        if (age >= 46 && age <= 50) return "46-50";
        if (age >= 51 && age <= 55) return "51-55";
        if (age >= 56 && age <= 60) return "56-60";
        return "Unknown";
    }
    
    private String getNMLStatus(int age, double sumAssured) {
        String ageBand = getAgeBand(age);
        Map<String, String> ageBandGrid = NML_GRID.get(ageBand);
        if (ageBandGrid == null) return "Unknown";
        
        if (sumAssured <= 20_00_000) {
            return ageBandGrid.get("0-2000000");
        } else if (sumAssured <= 50_00_000) {
            return ageBandGrid.get("2000001-5000000");
        } else if (sumAssured <= 75_00_000) {
            return ageBandGrid.get("5000001-7500000");
        } else if (sumAssured <= 1_00_00_000) {
            return ageBandGrid.get("7500001-10000000");
        } else {
            return ageBandGrid.get("10000001+");
        }
    }
    
    private void validate(BajajLifeRequest req) {
        if (req.entryAge < 18 || req.entryAge > 60) {
            throw new IllegalArgumentException("Entry age must be between 18-60 years.");
        }
        
        if (req.sumAssured < 10_00_000 || req.sumAssured > 15_00_00_000) {
            throw new IllegalArgumentException("Sum Assured must be between INR 10,00,000 and INR 15,00,00,000.");
        }
        
        if (req.coverTermMonths < 1 || req.coverTermMonths > 60) {
            throw new IllegalArgumentException("Cover term must be between 1-60 months.");
        }
    }
    
    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}

