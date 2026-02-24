class Order {
  final String id;
  final String customerId;
  final String vehicleNumber;
  final int? indentNumber;
  final String fuelType;
  final double? amountRequested;
  final double? quantityRequested;
  final int cash;
  final String status;
  final DateTime? deliveredAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Order({
    required this.id,
    required this.customerId,
    required this.vehicleNumber,
    this.indentNumber,
    required this.fuelType,
    this.amountRequested,
    this.quantityRequested,
    required this.cash,
    required this.status,
    this.deliveredAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id'] as String,
      customerId: json['customerId'] as String,
      vehicleNumber: json['vehicleNumber'] as String,
      indentNumber: (json['indentNumber'] as num?)?.toInt(),
      fuelType: json['fuelType'] as String,
      amountRequested: json['amountRequested'] != null
          ? (json['amountRequested'] as num).toDouble()
          : null,
      quantityRequested: json['quantityRequested'] != null
          ? (json['quantityRequested'] as num).toDouble()
          : null,
      cash: (json['cash'] as num?)?.toInt() ?? 0,
      status: json['status'] as String,
      deliveredAt: json['deliveredAt'] != null
          ? DateTime.parse(json['deliveredAt'] as String)
          : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'customerId': customerId,
      'vehicleNumber': vehicleNumber,
      'indentNumber': indentNumber,
      'fuelType': fuelType,
      'amountRequested': amountRequested,
      'quantityRequested': quantityRequested,
      'cash': cash,
      'status': status,
      'deliveredAt': deliveredAt?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  Order copyWith({
    String? id,
    String? customerId,
    String? vehicleNumber,
    String? fuelType,
    double? amountRequested,
    double? quantityRequested,
    int? cash,
    String? status,
    DateTime? deliveredAt,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Order(
      id: id ?? this.id,
      customerId: customerId ?? this.customerId,
      vehicleNumber: vehicleNumber ?? this.vehicleNumber,
      fuelType: fuelType ?? this.fuelType,
      amountRequested: amountRequested ?? this.amountRequested,
      quantityRequested: quantityRequested ?? this.quantityRequested,
      cash: cash ?? this.cash,
      status: status ?? this.status,
      deliveredAt: deliveredAt ?? this.deliveredAt,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

class FuelPrice {
  final String id;
  final String fuelType;
  final double pricePerLiter;
  final DateTime date;
  final DateTime? effectiveFrom;
  final DateTime? updatedAt;
  final DateTime createdAt;

  const FuelPrice({
    required this.id,
    required this.fuelType,
    required this.pricePerLiter,
    required this.date,
    this.effectiveFrom,
    this.updatedAt,
    required this.createdAt,
  });

  factory FuelPrice.fromJson(Map<String, dynamic> json) {
    return FuelPrice(
      id: json['id'] as String,
      fuelType: json['fuelType'] as String,
      pricePerLiter: (json['pricePerLiter'] as num).toDouble(),
      date: DateTime.parse(json['date'] as String),
      effectiveFrom: json['effectiveFrom'] != null
          ? DateTime.parse(json['effectiveFrom'] as String)
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'] as String)
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.parse(json['date'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fuelType': fuelType,
      'pricePerLiter': pricePerLiter,
      'date': date.toIso8601String(),
      'effectiveFrom': effectiveFrom?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
    };
  }
}

class Bill {
  final String id;
  final String orderId;
  final double quantityDelivered;
  final double pricePerLiter;
  final double totalAmount;
  final double cashAdvance;
  final double adjustments;
  final double netAmount;
  final String status;
  final DateTime? paidAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Bill({
    required this.id,
    required this.orderId,
    required this.quantityDelivered,
    required this.pricePerLiter,
    required this.totalAmount,
    required this.cashAdvance,
    required this.adjustments,
    required this.netAmount,
    required this.status,
    this.paidAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Bill.fromJson(Map<String, dynamic> json) {
    return Bill(
      id: json['id'] as String,
      orderId: json['orderId'] as String,
      quantityDelivered: (json['quantityDelivered'] as num).toDouble(),
      pricePerLiter: (json['pricePerLiter'] as num).toDouble(),
      totalAmount: (json['totalAmount'] as num).toDouble(),
      cashAdvance: (json['cashAdvance'] as num).toDouble(),
      adjustments: (json['adjustments'] as num?)?.toDouble() ?? 0.0,
      netAmount: (json['netAmount'] as num).toDouble(),
      status: json['status'] as String,
      paidAt: json['paidAt'] != null
          ? DateTime.parse(json['paidAt'] as String)
          : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'orderId': orderId,
      'quantityDelivered': quantityDelivered,
      'pricePerLiter': pricePerLiter,
      'totalAmount': totalAmount,
      'cashAdvance': cashAdvance,
      'adjustments': adjustments,
      'netAmount': netAmount,
      'status': status,
      'paidAt': paidAt?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}

class User {
  final String id;
  final String email;
  final String fullName;
  final String? phone;
  final String role;
  final DateTime createdAt;

  const User({
    required this.id,
    required this.email,
    required this.fullName,
    this.phone,
    required this.role,
    required this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      fullName: json['fullName'] as String,
      phone: json['phone'] as String?,
      role: json['role'] as String? ?? 'CUSTOMER',
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'fullName': fullName,
      'phone': phone,
      'role': role,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
